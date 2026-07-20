const prisma = require('../database/prismaClient');
const auditService = require('../services/auditService');
const productService = require('../services/productService');
const { VariantCreateSchema, VariantUpdateSchema } = require('../validation/productSchemas');

function sanitizeVariant(v) {
  if (!v) return v;
  return {
    id: v.id,
    sku: v.sku || null,
    name: v.name || null,
    price: (v.price && v.price.toString) ? v.price.toString() : v.price || null,
    stock: typeof v.stock === 'number' ? v.stock : null,
    meta: v.meta || {}
  };
}

exports.createVariant = async (req, res, next) => {
  try {
    const parsed = VariantCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
    const productId = req.params.productId;
    const created = await productService.createVariant(productId, parsed.data, prisma);
    try { await auditService.create({ actorId: req.user?.id ?? null, action: 'variant.create', meta: { productId, variantId: created.id } }); } catch (e) {}
    res.status(201).json({ variant: sanitizeVariant(created) });
  } catch (err) {
    next(err);
  }
};

exports.updateVariant = async (req, res, next) => {
  try {
    const parsed = VariantUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
    const variantId = req.params.id;
    const updated = await productService.updateVariant(variantId, parsed.data, prisma);
    try { await auditService.create({ actorId: req.user?.id ?? null, action: 'variant.update', meta: { variantId } }); } catch (e) {}
    res.json({ variant: sanitizeVariant(updated) });
  } catch (err) {
    next(err);
  }
};

exports.deleteVariant = async (req, res, next) => {
  try {
    const variantId = req.params.id;
    await productService.deleteVariant(variantId, prisma);
    try { await auditService.create({ actorId: req.user?.id ?? null, action: 'variant.delete', meta: { variantId } }); } catch (e) {}
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.listVariants = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const variants = await prisma.productVariant.findMany({ where: { productId } });
    res.json({ items: (variants || []).map(sanitizeVariant) });
  } catch (err) {
    next(err);
  }
};