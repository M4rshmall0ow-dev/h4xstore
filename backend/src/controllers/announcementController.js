const prisma = require('../database/prismaClient');
const { z } = require('zod');

const AnnouncementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  active: z.boolean().optional()
});

exports.listAnnouncements = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10) || 1;
    const perPage = parseInt(req.query.perPage || req.query.PageSize || '25', 10) || 25;
    const skip = (page - 1) * perPage;

    const [total, announcements] = await Promise.all([
      prisma.announcement.count(),
      prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage
      })
    ]);

    res.json({ success: true, data: { announcements, total, page, perPage } });
  } catch (err) {
    next(err);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const parsed = AnnouncementSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.format() });

    const announcement = await prisma.announcement.create({
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
        active: parsed.data.active ?? true
      }
    });

    res.status(201).json({ success: true, data: { announcement } });
  } catch (err) {
    next(err);
  }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { announcement } });
  } catch (err) {
    next(err);
  }
};
