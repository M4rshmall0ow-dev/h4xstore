const prisma = require('../database/prismaClient');

async function listUsers(req, res, next) {
  try {
    const { page = 1, perPage = 20, q } = req.query;
    const where = {};
    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } }
      ];
    }
    const skip = (Number(page) - 1) * Number(perPage);
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, skip, take: Number(perPage), select: { id: true, email: true, username: true, createdAt: true, isSuspended: true } })
    ]);
    res.json({ total, page: Number(page), perPage: Number(perPage), users });
  } catch (err) { next(err); }
}

async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, username: true, displayName: true, createdAt: true, isSuspended: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
}

async function patchUser(req, res, next) {
  try {
    const { id } = req.params;
    const data = req.body || {};
    // Only allow certain fields to be updated by admins
    const allowed = ['displayName', 'username', 'isVerified', 'isSuspended'];
    const updateData = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(data, key)) updateData[key] = data[key];
    }

    const user = await prisma.user.update({ where: { id }, data: updateData, select: { id: true, email: true, username: true, displayName: true, isVerified: true, isSuspended: true } });

    // audit
    try { const { logAudit } = require('../services/auditService'); await logAudit({ actorId: req.user && req.user.id, action: 'user.update', meta: { targetUserId: id, changes: updateData } }); } catch (e) { /* ignore */ }

    res.json({ user });
  } catch (err) { next(err); }
}

async function resetUserPasswordAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    await prisma.passwordReset.create({ data: { userId: id, token, expiresAt } });
    const emailService = require('../services/emailService');
    await emailService.sendPasswordResetEmail(user, token);
    try { const { logAudit } = require('../services/auditService'); await logAudit({ actorId: req.user && req.user.id, action: 'user.resetPassword', meta: { targetUserId: id } }); } catch (e) {}
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    // configurable behaviour: if env USER_DELETE_STRATEGY=hard delete, perform real delete
    const strategy = process.env.USER_DELETE_STRATEGY || 'soft';
    if (strategy === 'hard') {
      await prisma.user.delete({ where: { id } });
      try { const { logAudit } = require('../services/auditService'); await logAudit({ actorId: req.user && req.user.id, action: 'user.delete', meta: { targetUserId: id, strategy: 'hard' } }); } catch (e) {}
      return res.json({ ok: true });
    }

    // default soft-anonymize
    await prisma.session.updateMany({ where: { userId: id }, data: { revoked: true } });
    await prisma.user.update({ where: { id }, data: { email: `deleted+${id}@invalid.local`, username: null, displayName: null, isSuspended: true } });
    try { const { logAudit } = require('../services/auditService'); await logAudit({ actorId: req.user && req.user.id, action: 'user.delete', meta: { targetUserId: id, strategy: 'soft' } }); } catch (e) {}
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function suspendUser(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.user.update({ where: { id }, data: { isSuspended: true } });
    try { const { logAudit } = require('../services/auditService'); await logAudit({ actorId: req.user && req.user.id, action: 'user.suspend', meta: { targetUserId: id } }); } catch (e) {}
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function terminateUser(req, res, next) {
  try {
    const { id } = req.params;
    // termination strategy: revoke sessions, anonymize data
    await prisma.session.updateMany({ where: { userId: id }, data: { revoked: true } });
    await prisma.user.update({ where: { id }, data: { email: `terminated+${id}@invalid.local`, username: null, isSuspended: true } });
    try { const { logAudit } = require('../services/auditService'); await logAudit({ actorId: req.user && req.user.id, action: 'user.terminate', meta: { targetUserId: id } }); } catch (e) {}
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function forceLogout(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.session.updateMany({ where: { userId: id }, data: { revoked: true, revokedAt: new Date() } });
    try { const { logAudit } = require('../services/auditService'); await logAudit({ actorId: req.user && req.user.id, action: 'user.forceLogout', meta: { targetUserId: id } }); } catch (e) {}
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { listUsers, getUser, patchUser, deleteUser, suspendUser, terminateUser, forceLogout, resetUserPasswordAdmin };

