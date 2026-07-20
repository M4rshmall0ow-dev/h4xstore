const prisma = require('../database/prismaClient');

async function logAudit({ actorId = null, actorType = null, action, meta = {} }) {
  try {
    await prisma.auditLog.create({ data: { actorId, actorType, action, meta } });
  } catch (err) {
    // Don't throw — audit failures should not break main flow, but log for operators
    // eslint-disable-next-line no-console
    console.error('Audit log failed', err);
  }
}

// Provide backward-compatible alias `create` used by controllers
async function create(payload) {
  return logAudit(payload);
}

module.exports = { logAudit, create };