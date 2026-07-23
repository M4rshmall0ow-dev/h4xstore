const prisma = require('../database/prismaClient');
const { z } = require('zod');

const CouponSchema = z.object({
  code: z.string().min(1),
  discountPct: z.number().int().min(1).max(100),
  expiresAt: z.string().optional(),
  storeId: z.string().optional()
});

exports.listCoupons = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10) || 1;
    const perPage = parseInt(req.query.perPage || req.query.PageSize || '25', 10) || 25;
    const skip = (page - 1) * perPage;

    const [total, coupons] = await Promise.all([
      prisma.coupon.count(),
      prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage
      })
    ]);

    res.json({ success: true, data: { coupons, total, page, perPage } });
  } catch (err) {
    next(err);
  }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const parsed = CouponSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.format() });

    const coupon = await prisma.coupon.create({
      data: {
        code: parsed.data.code.toUpperCase(),
        discountPct: parsed.data.discountPct,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null
      }
    });

    res.status(201).json({ success: true, data: { coupon } });
  } catch (err) {
    next(err);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const parsed = CouponSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.format() });

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        ...(parsed.data.code ? { code: parsed.data.code.toUpperCase() } : {}),
        ...(typeof parsed.data.discountPct !== 'undefined' ? { discountPct: parsed.data.discountPct } : {}),
        ...(typeof parsed.data.expiresAt !== 'undefined' ? { expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null } : {})
      }
    });

    res.json({ success: true, data: { coupon } });
  } catch (err) {
    next(err);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Coupon deleted' } });
  } catch (err) {
    next(err);
  }
};
