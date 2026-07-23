const prisma = require('../database/prismaClient');

async function getSettings(req, res, next) {
  try {
    const settings = await prisma.setting.findMany();
    const data = settings.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
    res.json({ success: true, data: { settings: data } });
  } catch (err) {
    next(err);
  }
}

async function saveSetting(req, res, next) {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ success: false, error: 'Setting key is required' });

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    res.json({ success: true, data: { setting } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, saveSetting };

