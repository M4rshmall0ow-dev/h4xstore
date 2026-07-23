const prisma = require('../database/prismaClient');
const { z } = require('zod');

const MediaSchema = z.object({
  youtubeId: z.string().min(11),
  title: z.string().min(1),
  publisher: z.string().optional()
});

exports.listMedia = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10) || 1;
    const perPage = parseInt(req.query.perPage || req.query.PageSize || '25', 10) || 25;
    const skip = (page - 1) * perPage;

    const [total, media] = await Promise.all([
      prisma.media.count(),
      prisma.media.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage
      })
    ]);

    res.json({ success: true, data: { media, total, page, perPage } });
  } catch (err) {
    next(err);
  }
};

exports.createMedia = async (req, res, next) => {
  try {
    const parsed = MediaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.format() });

    const media = await prisma.media.create({
      data: {
        youtubeId: parsed.data.youtubeId,
        title: parsed.data.title,
        publisher: parsed.data.publisher || null
      }
    });

    res.status(201).json({ success: true, data: { media } });
  } catch (err) {
    next(err);
  }
};

exports.deleteMedia = async (req, res, next) => {
  try {
    const media = await prisma.media.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { media } });
  } catch (err) {
    next(err);
  }
};
