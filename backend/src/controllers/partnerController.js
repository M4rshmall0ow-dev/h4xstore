const prisma = require('../database/prismaClient');

async function listPartners(req, res, next) {
  try {
    const partners = await prisma.partner.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: { partners } });
  } catch (err) {
    next(err);
  }
}

async function createPartner(req, res, next) {
  try {
    const { name, meta } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'name is required' });
    const partner = await prisma.partner.create({ data: { name, meta: meta || {} } });
    res.status(201).json({ success: true, data: { partner } });
  } catch (err) {
    next(err);
  }
}

async function updatePartner(req, res, next) {
  try {
    const { id } = req.params;
    const { name, meta } = req.body;
    const partner = await prisma.partner.update({ where: { id }, data: { name, meta: meta || {} } });
    res.json({ success: true, data: { partner } });
  } catch (err) {
    next(err);
  }
}

async function deletePartner(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.partner.delete({ where: { id } });
    res.json({ success: true, data: { message: 'Partner deleted' } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listPartners, createPartner, updatePartner, deletePartner };

