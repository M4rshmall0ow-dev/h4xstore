const prisma = require('../database/prismaClient');
const auditService = require('../services/auditService');
const productService = require('../services/productService');
const { ProductCreateSchema, ProductUpdateSchema } = require('../validation/productSchemas');

function sanitizeProduct(p) {
  if (!p) return p;
  return {
    id: p.id,
    sku: p.sku || null,
    name: p.name,
    description: p.description || null,
    price: (p.price && p.price.toString) ? p.price.toString() : (p.price || null),
    currency: p.currency || 'USD',
    featured: !!p.featured,
    visible: typeof p.visible === 'undefined' ? true : !!p.visible,
    categories: p.categories || [],
    images: p.images || [],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  };
}

exports.createProduct = async (req, res, next) => {
  try {
    const parsed = ProductCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

    const created = await productService.createProduct(parsed.data, prisma);
    // audit
    try { await auditService.create({ actorId: req.user?.id ?? null, action: 'product.create', meta: { productId: created.id } }); } catch (e) {}

    return res.status(201).json({ product: sanitizeProduct(created) });
  } catch (err) {
    next(err);
  }
};

exports.listProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10) || 1;
    const perPage = parseInt(req.query.perPage || req.query.per_page || '25', 10) || 25;
    const q = req.query.q || undefined;
    const categories = req.query.categories ? (Array.isArray(req.query.categories) ? req.query.categories : String(req.query.categories).split(',')) : undefined;
    const visible = typeof req.query.visible !== 'undefined' ? (req.query.visible === 'true') : undefined;

    const { total, items } = await productService.listProducts({ page, perPage, q, categories, visible }, prisma);
    const out = items.map(sanitizeProduct);
    res.json({ total, page, perPage, items: out });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await productService.getProductById(id, prisma);
    if (!product) return res.status(404).json({ error: 'not_found' });
    const sanitized = sanitizeProduct(product);
    sanitized.variants = (product.variants || []).map(v => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: (v.price && v.price.toString) ? v.price.toString() : v.price,
      stock: typeof v.stock === 'number' ? v.stock : null,
      meta: v.meta || {}
    }));
    sanitized.inventory = product.inventory ? {
      stock: product.inventory.stock,
      reserved: product.inventory.reserved,
      updatedAt: product.inventory.updatedAt
    } : null;
    res.json({ product: sanitized });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const parsed = ProductUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
    const id = req.params.id;
    const updated = await productService.updateProduct(id, parsed.data, prisma);
    try { await auditService.create({ actorId: req.user?.id ?? null, action: 'product.update', meta: { productId: id } }); } catch (e) {}
    res.json({ product: sanitizeProduct(updated) });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const deleted = await productService.deleteProduct(id, prisma);
    try { await auditService.create({ actorId: req.user?.id ?? null, action: 'product.delete', meta: { productId: id } }); } catch (e) {}
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};