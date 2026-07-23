const prisma = require('../database/prismaClient');
const { hashPassword, verifyPassword } = require('../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../auth/jwt');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const emailService = require('../services/emailService');

function buildAuthPayload(user, { ownsKey = false, isAffiliate = false, role = 'user' } = {}) {
  return {
    sub: user.id,
    email: user.email,
    username: user.username,
    role,
    ownsKey,
    isAffiliate
  };
}

async function register(req, res, next) {
  try {
    let { email, password, username } = req.body;
    if (!password || !username) return res.status(400).json({ success: false, error: 'username and password required' });

    username = username.toString().trim();
    email = (email || `${username.toLowerCase()}@h4x.com`).toString().trim().toLowerCase();
    if (!email || !password) return res.status(400).json({ success: false, error: 'username and password required' });

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) return res.status(409).json({ success: false, error: 'Email already in use' });

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) return res.status(409).json({ success: false, error: 'Username already in use' });

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, password: hashed, username } });

    const role = await prisma.role.findUnique({ where: { name: 'User' } });
    if (role) {
      await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    }

    const token = uuidv4();
    await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) } });
    await emailService.sendVerificationEmail(user, token);

    res.status(201).json({ success: true, data: { id: user.id, email: user.email, username: user.username, role: 'user', ownsKey: false, isAffiliate: false } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'email and password required' });

    const normalized = email.toString().trim().toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { username: normalized } });
    }

    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const valid = await verifyPassword(user.password, password);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    if (user.isSuspended) return res.status(403).json({ success: false, error: 'User suspended' });

    const [roleEntries, affiliateEntry, paidOrdersCount] = await Promise.all([
      prisma.userRole.findMany({ where: { userId: user.id }, include: { role: true } }),
      prisma.affiliate.findFirst({ where: { userId: user.id } }),
      prisma.order.count({ where: { userId: user.id, status: 'paid' } })
    ]);

    const roleNames = roleEntries.map(entry => entry.role.name.toLowerCase());
    const userRole = roleNames.includes('admin') ? 'admin' : roleNames[0] || 'user';
    const ownsKey = paidOrdersCount > 0;
    const isAffiliate = !!affiliateEntry;

    const accessToken = signAccessToken(buildAuthPayload(user, { role: userRole, ownsKey, isAffiliate }));
    const refreshToken = signRefreshToken({ sub: user.id });

    const roleNames = roleEntries.map(entry => entry.role.name.toLowerCase());
    const userRole = roleNames.includes('admin') ? 'admin' : roleNames[0] || 'user';
    const ownsKey = paidOrdersCount > 0;
    const isAffiliate = !!affiliateEntry;

    const expiresAt = new Date(Date.now() + config.refreshExpiresIn * 1000);
    await prisma.session.create({ data: { userId: user.id, refreshToken, expiresAt } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: config.refreshExpiresIn * 1000
    });

    res.json({ success: true, data: { accessToken, user: { id: user.id, email: user.email, username: user.username, role: userRole, ownsKey, isAffiliate } } });
  } catch (err) {
    next(err);
  }
}

async function discordOAuth(req, res, next) {
  try {
    const discordUser = req.body && req.body.discordUser;
    if (!discordUser || !discordUser.email) {
      return res.status(400).json({ success: false, error: 'Discord user data is required' });
    }

    const normalizedEmail = discordUser.email.toString().trim().toLowerCase();
    const username = discordUser.username ? discordUser.username.toString().trim() : normalizedEmail.split('@')[0];

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      const password = uuidv4();
      const hashed = await hashPassword(password);
      user = await prisma.user.create({ data: { email: normalizedEmail, password: hashed, username } });
      const role = await prisma.role.findUnique({ where: { name: 'User' } });
      if (role) {
        await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
      }
    }

    if (user.isSuspended) return res.status(403).json({ success: false, error: 'User suspended' });

    const [roleEntries, affiliateEntry, paidOrdersCount] = await Promise.all([
      prisma.userRole.findMany({ where: { userId: user.id }, include: { role: true } }),
      prisma.affiliate.findFirst({ where: { userId: user.id } }),
      prisma.order.count({ where: { userId: user.id, status: 'paid' } })
    ]);

    const roleNames = roleEntries.map(entry => entry.role.name.toLowerCase());
    const userRole = roleNames.includes('admin') ? 'admin' : roleNames[0] || 'user';
    const ownsKey = paidOrdersCount > 0;
    const isAffiliate = !!affiliateEntry;

    const accessToken = signAccessToken(buildAuthPayload(user, { role: userRole, ownsKey, isAffiliate }));
    const refreshToken = signRefreshToken({ sub: user.id });

    const roleNames = roleEntries.map(entry => entry.role.name.toLowerCase());
    const userRole = roleNames.includes('admin') ? 'admin' : roleNames[0] || 'user';
    const ownsKey = paidOrdersCount > 0;
    const isAffiliate = !!affiliateEntry;

    const expiresAt = new Date(Date.now() + config.refreshExpiresIn * 1000);
    await prisma.session.create({ data: { userId: user.id, refreshToken, expiresAt } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: config.refreshExpiresIn * 1000
    });

    res.json({ success: true, data: { accessToken, user: { id: user.id, email: user.email, username: user.username, role: userRole, ownsKey, isAffiliate } } });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, error: 'Missing refresh token' });

    let payload;
    try { payload = verifyRefreshToken(token); } catch (e) { return res.status(401).json({ success: false, error: 'Invalid refresh token' }); }

    const session = await prisma.session.findUnique({ where: { refreshToken: token } });
    if (!session || session.revoked) return res.status(401).json({ success: false, error: 'Session invalid' });
    if (new Date(session.expiresAt) < new Date()) return res.status(401).json({ success: false, error: 'Refresh token expired' });

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    const [roleEntries, affiliateEntry, paidOrdersCount] = await Promise.all([
      prisma.userRole.findMany({ where: { userId: user.id }, include: { role: true } }),
      prisma.affiliate.findFirst({ where: { userId: user.id } }),
      prisma.order.count({ where: { userId: user.id, status: 'paid' } })
    ]);

    const roleNames = roleEntries.map(entry => entry.role.name.toLowerCase());
    const userRole = roleNames.includes('admin') ? 'admin' : roleNames[0] || 'user';
    const ownsKey = paidOrdersCount > 0;
    const isAffiliate = !!affiliateEntry;

    const accessToken = signAccessToken(buildAuthPayload(user, { role: userRole, ownsKey, isAffiliate }));
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (token) {
      await prisma.session.updateMany({ where: { refreshToken: token }, data: { revoked: true, revokedAt: new Date() } });
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, data: { message: 'Logged out' } });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'email required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ success: true, data: { message: 'If an account exists with that email, a reset message has been sent.' } });

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });
    await emailService.sendPasswordResetEmail(user, token);

    res.json({ success: true, data: { message: 'If an account exists with that email, a reset message has been sent.' } });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, error: 'token and newPassword required' });

    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || new Date(reset.expiresAt) < new Date()) return res.status(400).json({ success: false, error: 'Invalid or expired token' });

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: reset.userId }, data: { password: hashed } });
    await prisma.passwordReset.deleteMany({ where: { userId: reset.userId } });

    res.json({ success: true, data: { message: 'Password reset successful' } });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const { oldPassword, newPassword } = req.body;
    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'oldPassword and newPassword are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const valid = await verifyPassword(user.password, oldPassword);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid current password' });

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    res.json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });
    const [user, affiliateEntry, paidOrdersCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, username: true, displayName: true, createdAt: true, isVerified: true } }),
      prisma.affiliate.findFirst({ where: { userId } }),
      prisma.order.count({ where: { userId, status: 'paid' } })
    ]);

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const userRole = (req.user.roles || []).includes('admin') ? 'admin' : (req.user.roles[0] || 'user');
    res.json({ success: true, data: { user: { ...user, role: userRole, ownsKey: paidOrdersCount > 0, isAffiliate: !!affiliateEntry } } });
  } catch (err) { next(err); }
}

module.exports = { register, login, discordOAuth, refresh, logout, forgotPassword, resetPassword, changePassword, me };

