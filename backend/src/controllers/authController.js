const prisma = require('../database/prismaClient');
const { hashPassword, verifyPassword } = require('../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../auth/jwt');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const emailService = require('../services/emailService');

async function register(req, res, next) {
  try {
    const { email, password, username } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, password: hashed, username } });

    // assign default role 'User' if exists
    const role = await prisma.role.findUnique({ where: { name: 'User' } });
    if (role) {
      await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    }

    // email verification -- create token
    const token = uuidv4();
    // store as PasswordReset for now; or create separate Verification model
    await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) } });
    await emailService.sendVerificationEmail(user, token);

    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await verifyPassword(user.password, password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.isSuspended) return res.status(403).json({ error: 'User suspended' });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id });

    // store refresh token in sessions
    const expiresAt = new Date(Date.now() + config.refreshExpiresIn * 1000);
    await prisma.session.create({ data: { userId: user.id, refreshToken, expiresAt } });

    // send tokens. Access token typically in body; refresh token as HttpOnly secure cookie (frontend must include credentials: 'include')
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: config.refreshExpiresIn * 1000
    });

    res.json({ accessToken, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: 'Missing refresh token' });

    let payload;
    try { payload = verifyRefreshToken(token); } catch (e) { return res.status(401).json({ error: 'Invalid refresh token' }); }

    // check session exists and not revoked
    const session = await prisma.session.findUnique({ where: { refreshToken: token } });
    if (!session || session.revoked) return res.status(401).json({ error: 'Session invalid' });
    if (new Date(session.expiresAt) < new Date()) return res.status(401).json({ error: 'Refresh token expired' });

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    res.json({ accessToken });
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
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ ok: true }); // don't reveal

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1h
    await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });
    await emailService.sendPasswordResetEmail(user, token);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword required' });

    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || new Date(reset.expiresAt) < new Date()) return res.status(400).json({ error: 'Invalid or expired token' });

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: reset.userId }, data: { password: hashed } });
    // remove reset tokens for user
    await prisma.passwordReset.deleteMany({ where: { userId: reset.userId } });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, username: true, displayName: true, createdAt: true, isVerified: true } });
    res.json({ user });
  } catch (err) { next(err); }
}

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, me };
