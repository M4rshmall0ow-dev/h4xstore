const prisma = require('../database/prismaClient');
const licenseService = require('../services/licenseService');
const { z } = require('zod');

const ImportKeysSchema = z.object({ productId: z.string().uuid(), keys: z.array(z.string()).min(1) });

async function importKeys(req, res, next) {
  try {
    // allow multipart/form-data or JSON. For now, handle JSON body
    const parsed = ImportKeysSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
    const { productId, keys } = parsed.data;
    const result = await licenseService.importKeys({ productId, keys, prisma });
    await require('../services/auditService').logAudit({ actorId: req.user && req.user.id, action: 'license.import', meta: { productId, count: result.imported } });
    res.status(201).json({ imported: result.imported });
  } catch (err) { next(err); }
}

async function listKeys(req, res, next) {
  try {
    const { productId } = req.query;
    const where = {};
    if (productId) where.productId = productId;
    const keys = await prisma.licenseKey.findMany({ where, select: { id: true, key: true, productId: true, used: true, assignedToId: true, usedAt: true } });
    res.json({ total: keys.length, items: keys });
  } catch (err) { next(err); }
}

async function revokeKey(req, res, next) {
  try {
    const { id } = req.params;
    const key = await prisma.licenseKey.findUnique({ where: { id } });
    if (!key) return res.status(404).json({ error: 'Key not found' });
    await prisma.licenseKey.update({ where: { id }, data: { used: false, usedAt: null, orderId: null, assignedToId: null } });
    await require('../services/auditService').logAudit({ actorId: req.user && req.user.id, action: 'license.revoke', meta: { keyId: id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { importKeys, listKeys, revokeKey };

