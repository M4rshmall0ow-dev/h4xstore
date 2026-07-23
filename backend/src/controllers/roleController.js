const prisma = require('../database/prismaClient');
const { logAudit } = require('../services/auditService');

async function listRoles(req, res, next) {
  try {
    const roles = await prisma.role.findMany({ include: { permissions: { include: { permission: true } } } });
    res.json({ roles });
  } catch (err) { next(err); }
}

async function getRole(req, res, next) {
  try {
    const { id } = req.params;
    const role = await prisma.role.findUnique({ where: { id }, include: { permissions: { include: { permission: true } } } });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json({ role });
  } catch (err) { next(err); }
}

async function createRole(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const role = await prisma.role.create({ data: { name, description } });
    await logAudit({ actorId: req.user && req.user.id, action: 'role.create', meta: { roleId: role.id, name } });
    res.status(201).json({ role });
  } catch (err) { next(err); }
}

async function updateRole(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const role = await prisma.role.update({ where: { id }, data: { name, description } });
    await logAudit({ actorId: req.user && req.user.id, action: 'role.update', meta: { roleId: id } });
    res.json({ role });
  } catch (err) { next(err); }
}

async function deleteRole(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.role.delete({ where: { id } });
    await logAudit({ actorId: req.user && req.user.id, action: 'role.delete', meta: { roleId: id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function assignPermissions(req, res, next) {
  try {
    const { id } = req.params; // role id
    const { permissionIds = [] } = req.body; // array of permission ids to set

    // remove existing not in list, add new ones (idempotent)
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return res.status(404).json({ error: 'Role not found' });

    // delete those not in permissionIds
    await prisma.rolePermission.deleteMany({ where: { roleId: id, AND: permissionIds.length ? { permissionId: { notIn: permissionIds } } : {} } });

    // upsert provided permissions
    for (const pid of permissionIds) {
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: id, permissionId: pid } }, update: {}, create: { roleId: id, permissionId: pid } });
    }

    await logAudit({ actorId: req.user && req.user.id, action: 'role.assignPermissions', meta: { roleId: id, permissionIds } });

    const updated = await prisma.role.findUnique({ where: { id }, include: { permissions: { include: { permission: true } } } });
    res.json({ role: updated });
  } catch (err) { next(err); }
}

module.exports = { listRoles, getRole, createRole, updateRole, deleteRole, assignPermissions };
