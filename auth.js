/**
 * ==============================================================================
 * H4X-STORE ENTERPRISE AUTHENTICATION SYSTEM (v5.0.0 - SECURE AUTH OVERHAUL)
 * ==============================================================================
 */

const SecurityCore = {
  sha256: function(ascii) {
    function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
    const mathPow = Math.pow; const maxWord = mathPow(2, 32); const lengthProperty = 'length';
    let i, j, result = '', words = [], asciiBitLength = ascii[lengthProperty] * 8;
    let hash = SecurityCore.sha256.h = SecurityCore.sha256.h || [];
    let k = SecurityCore.sha256.k = SecurityCore.sha256.k || [];
    let primeCounter = k[lengthProperty];
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return; 
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength);
    for (j = 0; j < words[lengthProperty];) {
      let w = words.slice(j, j += 16); let oldHash = hash; hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        let w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        let temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
          (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
        let temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash); hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        let b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  },

  hmacSha256: function(key, message) {
    if (key.length > 64) key = SecurityCore.sha256(key);
    let keyPad = Array(64).fill(0);
    for (let i = 0; i < key.length; i++) keyPad[i] = key.charCodeAt(i);
    let i_pad = keyPad.map(b => b ^ 0x36).map(b => String.fromCharCode(b)).join('');
    let o_pad = keyPad.map(b => b ^ 0x5c).map(b => String.fromCharCode(b)).join('');
    let innerHash = SecurityCore.sha256(i_pad + message);
    let innerHashRaw = innerHash.match(/.{2}/g).map(h => String.fromCharCode(parseInt(h, 16))).join('');
    return SecurityCore.sha256(o_pad + innerHashRaw);
  },

  base64UrlEncode: function(str) {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  
  base64UrlDecode: function(str) {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return decodeURIComponent(escape(atob(b64)));
  },

  MASTER_KEY: "H4X_SECURE_VAULT_KEY_2026",
  encryptData: function(data) {
    const jsonStr = JSON.stringify(data); let encrypted = '';
    for (let i = 0; i < jsonStr.length; i++) encrypted += String.fromCharCode(jsonStr.charCodeAt(i) ^ this.MASTER_KEY.charCodeAt(i % this.MASTER_KEY.length));
    return btoa(encrypted);
  },
  decryptData: function(encryptedB64) {
    try {
      const encrypted = atob(encryptedB64); let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ this.MASTER_KEY.charCodeAt(i % this.MASTER_KEY.length));
      return JSON.parse(decrypted);
    } catch (e) { return null; }
  },

  sanitize: function(input) {
    if (typeof input === 'string') return input.replace(/[&<>"'/]/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', "/": '&#x2F;' }[match]));
    if (typeof input === 'object' && input !== null) for (let key in input) input[key] = SecurityCore.sanitize(input[key]);
    return input;
  },

  generateSecureCode: function(length = 6) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }
};

const JWT = {
  SECRET: SecurityCore.sha256("H4X_STORE_JWT_SIGNATURE_KEY_PRIVATE"),
  sign: function(payload, expiresInHours = 720) { 
    const header = { alg: "HS256", typ: "JWT" };
    const exp = Date.now() + (expiresInHours * 60 * 60 * 1000);
    const tokenPayload = { ...payload, exp: exp };
    const encodedHeader = SecurityCore.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = SecurityCore.base64UrlEncode(JSON.stringify(tokenPayload));
    const signature = SecurityCore.hmacSha256(this.SECRET, `${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  },
  verify: function(token) {
    if (!token) return { valid: false, reason: "No token provided" };
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, reason: "Malformed token" };
    const [header, payload, signature] = parts;
    if (signature !== SecurityCore.hmacSha256(this.SECRET, `${header}.${payload}`)) return { valid: false, reason: "Invalid signature" };
    try {
      const decodedPayload = JSON.parse(SecurityCore.base64UrlDecode(payload));
      if (Date.now() > decodedPayload.exp) return { valid: false, reason: "Token expired" };
      return { valid: true, decoded: decodedPayload };
    } catch (e) { return { valid: false, reason: "Payload error" }; }
  }
};

const Auth = {
  DB_KEY: 'h4x_secure_vault', 
  SESSION_KEY: 'h4x_jwt_session', 
  AUDIT_KEY: 'h4x_audit_logs', 
  RATE_LIMIT_KEY: 'h4x_rate_limit',
  RESET_TOKENS_KEY: 'h4x_reset_tokens',
  
  ADMIN_DISCORD_IDS: ['1228726738595614844', '1526555766994239589'], 

  init: function() {
    if (localStorage.getItem('h4x_users_db')) localStorage.removeItem('h4x_users_db'); 
    if (!localStorage.getItem(this.DB_KEY)) {
      const salt = SecurityCore.sha256(Date.now().toString()).substring(0, 8);
      const genesisUsers = [{ 
          id: 'usr_' + SecurityCore.sha256(Date.now().toString()).substring(0, 12), 
          username: 'GhostSniper', 
          password: SecurityCore.sha256(salt + 'password123'), 
          salt: salt, 
          email: 'ghost@h4x.com', 
          ownsKey: true, 
          isAffiliate: true, 
          role: 'admin', 
          status: 'Active',
          createdAt: Date.now(),
          lastLogin: Date.now(),
          sessionVer: Date.now()
      }];
      localStorage.setItem(this.DB_KEY, SecurityCore.encryptData(genesisUsers));
    }
  },

  logAudit: function(actor, discordId, action, prevValue = null, newValue = null) {
    let logs = []; 
    try { logs = JSON.parse(localStorage.getItem(this.AUDIT_KEY)) || []; } catch(e) {}
    
    logs.unshift({ 
        id: 'aud_' + Date.now().toString(36),
        timestamp: new Date().toISOString(), 
        actor: actor, 
        discordId: discordId || 'N/A',
        action: action,
        prevValue: prevValue,
        newValue: newValue
    });
    
    if (logs.length > 500) logs.pop(); 
    localStorage.setItem(this.AUDIT_KEY, JSON.stringify(logs));
  },

  getUsers: function() { const raw = localStorage.getItem(this.DB_KEY); return raw ? (SecurityCore.decryptData(raw) || []) : []; },
  saveUsers: function(usersArray) { localStorage.setItem(this.DB_KEY, SecurityCore.encryptData(usersArray)); },

  // SECURE PASSWORD VALIDATOR
  validatePasswordRequirements: function(password) {
      const hasLength = password.length >= 8;
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNum = /[0-9]/.test(password);
      const hasSpec = /[^A-Za-z0-9]/.test(password);

      if (!hasLength) return "Password must be at least 8 characters.";
      if (!hasUpper) return "Password must contain an uppercase letter.";
      if (!hasLower) return "Password must contain a lowercase letter.";
      if (!hasNum) return "Password must contain a number.";
      if (!hasSpec) return "Password must contain a special character.";
      return "VALID";
  },

  register: function(rawUsername, rawPassword) {
    const username = SecurityCore.sanitize(rawUsername.trim());
    if (username.length < 3) return { success: false, message: 'Username too short.' };
    
    const pwdCheck = this.validatePasswordRequirements(rawPassword);
    if (pwdCheck !== "VALID") return { success: false, message: pwdCheck };

    const users = this.getUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) return { success: false, message: 'Username already exists.' };
    
    const salt = SecurityCore.sha256(Date.now().toString()).substring(0, 16);
    const newUser = { 
        id: 'usr_' + SecurityCore.sha256(username + Date.now()).substring(0, 12), 
        username: username, 
        password: SecurityCore.sha256(salt + rawPassword), 
        salt: salt, 
        email: `${username.toLowerCase()}@h4x.com`, 
        ownsKey: false, 
        isAffiliate: false, 
        role: 'user',
        status: 'Active',
        createdAt: Date.now(),
        lastLogin: Date.now(),
        sessionVer: Date.now()
    };
    
    users.push(newUser); this.saveUsers(users); this.setSession(newUser);
    this.logAudit(newUser.username, null, "Account Created");
    return { success: true, message: 'Registration successful!', user: newUser }; 
  },

  login: function(rawUsername, rawPassword) {
    const username = SecurityCore.sanitize(rawUsername.trim());
    
    // STRICT RATE LIMITING & BRUTE FORCE PROTECTION
    let limits = JSON.parse(localStorage.getItem(this.RATE_LIMIT_KEY)) || {};
    const now = Date.now();
    const tracker = limits[username.toLowerCase()] || { attempts: 0, lockedUntil: 0 };

    if (tracker.lockedUntil > now) {
        const remainingMins = Math.ceil((tracker.lockedUntil - now) / 60000);
        this.logAudit("SYSTEM", null, "Blocked Brute Force Login Attempt", username, `Locked for ${remainingMins}m`);
        return { success: false, message: 'Account locked due to multiple failed attempts. Try again later.' };
    }

    if (tracker.lockedUntil > 0 && tracker.lockedUntil < now) {
        tracker.attempts = 0; 
        tracker.lockedUntil = 0;
    }

    const users = this.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    // Using generic error messages for security
    const genericError = 'Invalid credentials.';

    if (!user || user.password !== SecurityCore.sha256(user.salt + rawPassword)) {
        tracker.attempts += 1;
        if (tracker.attempts >= 5) {
            tracker.lockedUntil = now + (15 * 60 * 1000); // Lock for 15 mins
            this.logAudit("SYSTEM", null, "Account Locked (Max Attempts)", username, "15 Minutes");
        }
        limits[username.toLowerCase()] = tracker;
        localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(limits));
        return { success: false, message: genericError };
    }

    if (user.status === 'Banned') return { success: false, message: 'This account is permanently banned.' };
    if (user.status === 'Suspended') return { success: false, message: 'This account is currently suspended.' };

    // Reset rate limits on successful login
    delete limits[username.toLowerCase()];
    localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(limits));

    user.lastLogin = Date.now();
    user.sessionVer = user.sessionVer || Date.now(); // Backwards compat
    this.saveUsers(users);
    this.setSession(user);
    this.logAudit(user.username, user.discordId, "Successful Login");
    
    return { success: true, message: 'Login successful!', user: user }; 
  },

  // --------------------------------------------------------------------------
  // SECURE PASSWORD RESET FLOW
  // --------------------------------------------------------------------------

  requestPasswordReset: function(rawEmail) {
    const email = SecurityCore.sanitize(rawEmail.toLowerCase().trim());
    
    // Always return a generic success message to prevent email enumeration
    const genericResponse = { success: true, message: 'If an account exists with that email, a reset code has been sent.' };
    
    const users = this.getUsers();
    const targetUser = users.find(u => (u.email || "").toLowerCase() === email);
    
    if (!targetUser) {
        this.logAudit("SYSTEM", null, "Failed Reset Request (User Not Found)", email, "Silently Dropped");
        return genericResponse;
    }

    // Generate strict 6-digit OTP
    const code = SecurityCore.generateSecureCode();
    
    // Store token state
    let tokens = JSON.parse(localStorage.getItem(this.RESET_TOKENS_KEY)) || {};
    tokens[email] = {
        code: SecurityCore.sha256(code), // Store hash, not plaintext
        expiresAt: Date.now() + (15 * 60 * 1000), // 15 mins
        attempts: 0
    };
    localStorage.setItem(this.RESET_TOKENS_KEY, JSON.stringify(tokens));

    this.logAudit("SYSTEM", targetUser.discordId, "Generated OTP Password Reset", targetUser.username, "Emailed");

    // SIMULATE OFFICIAL EMAIL DISPATCH
    console.log(`
===================================================
Subject: H4xScripts Password Reset Verification Code
===================================================
Hello,

We received a request to reset the password for your H4xScripts account.

Your verification code is:
${code}

This code will expire in 15 minutes.

If you did not request this password reset, you can safely ignore this email.

— H4xScripts
===================================================
    `);

    // For ease of testing without opening console:
    alert(`[MOCK EMAIL SENT TO ${email}]\n\nSubject: H4xScripts Password Reset Verification Code\n\nYour verification code is:\n${code}\n\n(This code expires in 15 minutes)`);

    return genericResponse;
  },

  verifyAndResetPassword: function(rawEmail, inputCode, newPassword) {
      const email = SecurityCore.sanitize(rawEmail.toLowerCase().trim());
      let tokens = JSON.parse(localStorage.getItem(this.RESET_TOKENS_KEY)) || {};
      const record = tokens[email];

      if (!record) return { success: false, message: 'Invalid or expired verification code.' };

      // Expire old codes securely
      if (Date.now() > record.expiresAt) {
          delete tokens[email];
          localStorage.setItem(this.RESET_TOKENS_KEY, JSON.stringify(tokens));
          return { success: false, message: 'Verification code has expired. Please request a new one.' };
      }

      // Max attempts to prevent brute-forcing the 6 digit code
      if (record.attempts >= 5) {
          delete tokens[email];
          localStorage.setItem(this.RESET_TOKENS_KEY, JSON.stringify(tokens));
          return { success: false, message: 'Too many invalid attempts. Code invalidated.' };
      }

      // Validate Code Hash
      if (SecurityCore.sha256(inputCode) !== record.code) {
          record.attempts += 1;
          tokens[email] = record;
          localStorage.setItem(this.RESET_TOKENS_KEY, JSON.stringify(tokens));
          return { success: false, message: 'Incorrect verification code.' };
      }

      // Validate Password Security
      const pwdCheck = this.validatePasswordRequirements(newPassword);
      if (pwdCheck !== "VALID") return { success: false, message: pwdCheck };

      // Process Reset
      const users = this.getUsers();
      const userIndex = users.findIndex(u => (u.email || "").toLowerCase() === email);
      
      if (userIndex > -1) {
          const newSalt = SecurityCore.sha256(Date.now().toString()).substring(0, 16);
          users[userIndex].salt = newSalt;
          users[userIndex].password = SecurityCore.sha256(newSalt + newPassword);
          
          // STRICT SESSION INVALIDATION
          // Rotating sessionVer breaks all existing active JWT tokens globally
          users[userIndex].sessionVer = Date.now();
          
          this.saveUsers(users);
          this.logAudit("SYSTEM", users[userIndex].discordId, "Password Reset Completed", users[userIndex].username, "Sessions Invalidated");
      }

      // Burn OTP Token immediately to prevent reuse
      delete tokens[email];
      localStorage.setItem(this.RESET_TOKENS_KEY, JSON.stringify(tokens));

      return { success: true, message: 'Your password has been changed successfully. Please log in.' };
  },

  // --------------------------------------------------------------------------

  setSession: function(user) {
    const safeUser = { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        ownsKey: user.ownsKey, 
        isAffiliate: user.isAffiliate, 
        role: user.role, 
        discordLinked: user.discordLinked, 
        discordId: user.discordId, 
        status: user.status,
        sessionVer: user.sessionVer // Embedded version lock
    };
    localStorage.setItem(this.SESSION_KEY, JWT.sign(safeUser, 720)); 
  },
  
  logout: function() { localStorage.removeItem(this.SESSION_KEY); },
  isLoggedIn: function() { return this.getCurrentUser() !== null; },

  getCurrentUser: function() {
    const token = localStorage.getItem(this.SESSION_KEY); if (!token) return null;
    const verification = JWT.verify(token); if (!verification.valid) { this.logout(); return null; }
    
    const freshUser = this.getUsers().find(u => u.id === verification.decoded.id);
    
    // Strict Validation: Bans & Session Invalidation Match
    if (!freshUser || freshUser.status === 'Banned') { this.logout(); return null; }
    
    const userSessionVer = freshUser.sessionVer || 0;
    const tokenSessionVer = verification.decoded.sessionVer || 0;
    
    // If the database version is newer than the token (e.g. they reset password), kill the session!
    if (userSessionVer !== tokenSessionVer) { 
        this.logout(); 
        return null; 
    }
    
    const safeUser = { ...freshUser }; delete safeUser.password; delete safeUser.salt;
    return safeUser;
  },

  requireAuth: function(redirectUrl = 'Login.html') { if (!this.isLoggedIn()) window.location.href = redirectUrl; },

  handleDiscordUser: function(discordUser) {
    const users = this.getUsers();
    const safeUsername = SecurityCore.sanitize(discordUser.username);
    const isAdmin = this.ADMIN_DISCORD_IDS.includes(discordUser.id);
    const assignedRole = isAdmin ? 'admin' : 'user';

    let user = users.find(u => u.discordId === discordUser.id);
    if (!user) {
      user = { 
          id: 'usr_' + SecurityCore.sha256(discordUser.id + Date.now()).substring(0, 12), 
          username: safeUsername, 
          password: 'OAUTH_NO_PASSWORD', 
          salt: 'OAUTH_NO_SALT', 
          email: discordUser.email, 
          discordId: discordUser.id, 
          discordLinked: safeUsername, 
          ownsKey: isAdmin, 
          isAffiliate: isAdmin, 
          role: assignedRole,
          status: 'Active',
          createdAt: Date.now(),
          lastLogin: Date.now(),
          sessionVer: Date.now()
      };
      users.push(user); this.saveUsers(users);
    } else {
      if (user.status === 'Banned') return { success: false, message: 'This Discord account is tied to a banned user.' };
      if (isAdmin && user.role !== 'admin') { user.role = 'admin'; user.ownsKey = true; user.isAffiliate = true; this.saveUsers(users); }
      user.lastLogin = Date.now();
      user.sessionVer = user.sessionVer || Date.now();
      this.saveUsers(users);
    }
    
    this.setSession(user);
    return { success: true, user: user };
  }
};

Auth.init();