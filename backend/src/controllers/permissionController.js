const prisma = require('../database/prismaClient');
const { logAudit } = require('../services/auditService');

async function listPermissions(req, res, next) {
  try {
    const permissions = await prisma.permission.findMany();
    res.json({ permissions });
  } catch (err) { next(err); }
}

async function getPermission(req, res, next) {
  try {
    const { id } = req.params;
    const permission = await prisma.permission.findUnique({ where: { id } });
    if (!permission) return res.status(404).json({ error: 'Permission not found' });
    res.json({ permission });
  } catch (err) { next(err); }
}

async function createPermission(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const permission = await prisma.permission.create({ data: { name, description } });
    await logAudit({ actorId: req.user && req.user.id, action: 'permission.create', meta: { permissionId: permission.id, name } });
    res.status(201).json({ permission });
  } catch (err) { next(err); }
}

async function updatePermission(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const permission = await prisma.permission.update({ where: { id }, data: { name, description } });
    await logAudit({ actorId: req.user && req.user.id, action: 'permission.update', meta: { permissionId: id } });
    res.json({ permission });
  } catch (err) { next(err); }
}

async function deletePermission(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.permission.delete({ where: { id } });
    await logAudit({ actorId: req.user && req.user.id, action: 'permission.delete', meta: { permissionId: id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { listPermissions, getPermission, createPermission, updatePermission, deletePermission };
