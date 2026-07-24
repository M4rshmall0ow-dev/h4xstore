const API_BASE = window.API_BASE || (window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://YOUR_BACKEND_DOMAIN");

window.API_BASE = API_BASE;

function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.replace(/[&<>"',\/]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    })[char] || char);
  }

  if (typeof input === 'object' && input !== null) {
    const output = Array.isArray(input) ? [] : {};
    for (const key in input) {
      output[key] = sanitizeInput(input[key]);
    }
    return output;
  }

  return input;
}

async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const token = localStorage.getItem(Auth.SESSION_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }
  const response = await fetch(url, {
    credentials: 'include',
    headers,
    ...options
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (e) {
    // Non-JSON response
  }

  if (!response.ok) {
    return { success: false, error: payload?.error || payload?.message || response.statusText };
  }

  if (payload && payload.success === false) {
    return { success: false, error: payload.error || payload.message || 'Request failed' };
  }

  return { success: true, data: payload && typeof payload === 'object' && payload.success ? payload.data : payload };
}

function parseJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(decodeURIComponent(atob(parts[1]).split('').map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`).join('')));
  } catch (e) {
    return null;
  }
}

const SecurityCore = {
  sha256(str) {
    let hash = 0;
    if (!str) return '0';
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return (hash >>> 0).toString(16);
  },
  sanitize: sanitizeInput
};

const Auth = {
  SESSION_KEY: 'h4x_access_token',
  AUDIT_KEY: 'h4x_audit_logs',

  init() {
    localStorage.removeItem('h4x_users_db');
    localStorage.removeItem('h4x_user_info');
    localStorage.removeItem(this.AUDIT_KEY);
  },

  setSession(token) {
    if (!token) return;
    if (typeof token === 'object') {
      token = token.accessToken || token.token || token;
    }
    if (typeof token === 'string') {
      localStorage.setItem(this.SESSION_KEY, token);
    }
  },

  logout: async function() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout request failed', e);
    }
    localStorage.removeItem(this.SESSION_KEY);
  },

  getCurrentUser() {
    const token = localStorage.getItem(this.SESSION_KEY);
    if (!token) return null;
    const payload = parseJwt(token);
    if (!payload) {
      this.logout();
      return null;
    }
    if (payload.exp && Date.now() > payload.exp * 1000) {
      this.logout();
      return null;
    }
    return {
      id: payload.sub || null,
      email: payload.email || null,
      username: payload.username || payload.name || '',
      role: payload.role || 'user',
      discordLinked: payload.discordLinked || false,
      status: payload.status || 'Active',
      ownsKey: payload.ownsKey || false,
      isAffiliate: payload.isAffiliate || false
    };
  },

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  requireAuth(redirectUrl = 'Login.html') {
    if (!this.isLoggedIn()) window.location.href = redirectUrl;
  },

  refreshToken: async function() {
    const result = await apiFetch('/api/auth/refresh', { method: 'POST' });
    if (!result.success) return false;
    if (result.data && result.data.accessToken) {
      localStorage.setItem(this.SESSION_KEY, result.data.accessToken);
      return true;
    }
    return false;
  },

  register: async function(rawUsername, rawPassword) {
    const username = sanitizeInput(rawUsername.toString().trim());
    if (username.length < 3) return { success: false, message: 'Username too short.' };
    if (!rawPassword || rawPassword.length < 6) return { success: false, message: 'Password must be at least 6 characters.' };

    const result = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password: rawPassword, email: `${username.toLowerCase()}@h4x.com` })
    });

    if (!result.success) return { success: false, message: result.error || 'Registration failed.' };

    const loginResult = await this.login(username, rawPassword);
    if (!loginResult.success) return { success: false, message: loginResult.message || 'Failed to log in after registration.' };

    return { success: true, message: 'Registration successful!', user: loginResult.user };
  },

  login: async function(rawEmail, rawPassword) {
    const email = sanitizeInput(rawEmail.toString().trim());
    if (!email || !rawPassword) return { success: false, message: 'Email and password are required.' };

    const result = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: rawPassword })
    });

    if (!result.success) return { success: false, message: result.error || 'Invalid credentials.' };

    const data = result.data;
    this.setSession(data.accessToken || data.token);
    return { success: true, message: 'Login successful!', user: data.user };
  },

  requestPasswordReset: async function(rawEmail) {
    const email = sanitizeInput(rawEmail.toString().toLowerCase().trim());
    const result = await apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    return { success: result.success, message: result.success ? 'If an account exists with that email, a reset message has been sent.' : result.error || 'Unable to process reset request.' };
  },

  verifyAndResetPassword: async function(rawEmail, inputCode, newPassword) {
    const result = await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: inputCode, newPassword })
    });
    return { success: result.success, message: result.success ? 'Your password has been changed successfully. Please log in.' : result.error || 'Password reset failed.' };
  },

  changePassword: async function(oldPassword, newPassword) {
    const result = await apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword })
    });
    return { success: result.success, message: result.success ? 'Password changed successfully.' : result.error || 'Unable to change password.' };
  },

  handleDiscordUser: async function(discordUser) {
    const result = await apiFetch('/api/auth/oauth/discord', {
      method: 'POST',
      body: JSON.stringify({ discordUser })
    });
    if (!result.success) return { success: false, message: result.error || 'Discord login failed.' };
    if (result.data && result.data.accessToken) {
      this.setSession(result.data.accessToken);
    }
    return { success: true, user: result.data.user };
  },

  getUsers() {
    return [];
  },

  saveUsers() {
    return;
  },

  logAudit() {
    return;
  }
};

Auth.init();
window.apiFetch = apiFetch;
window.Auth = Auth;
window.SecurityCore = SecurityCore;






