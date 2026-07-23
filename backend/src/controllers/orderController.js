const prisma = require('../database/prismaClient');
const komerzaService = require('../services/komerzaService');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');

const OrderCreateSchema = z.object({
  items: z.array(z.object({ productId: z.string().uuid(), variantId: z.string().optional(), quantity: z.number().int().min(1) })),
  currency: z.string().length(3).optional().default('USD'),
  couponCode: z.string().optional()
});

async function createOrder(req, res, next) {
  try {
    const parsed = OrderCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
    const data = parsed.data;

    // compute total by fetching product prices
    let total = 0;
    const itemsDetailed = [];
    const LEGACY_PRODUCT_MAP = {
      '1': 'Lifetime Access',
      '2': '1 Month Access',
      '3': '1 Week Access'
    };

    for (const it of data.items) {
        let product = await prisma.product.findUnique({ where: { id: it.productId } });
        if (!product && it.productId) {
          product = await prisma.product.findFirst({ where: { sku: it.productId } });
        }
        if (!product && it.name) {
          product = await prisma.product.findFirst({ where: { name: { contains: it.name, mode: 'insensitive' } } });
        }
        if (!product && LEGACY_PRODUCT_MAP[it.productId]) {
          product = await prisma.product.findFirst({ where: { name: { contains: LEGACY_PRODUCT_MAP[it.productId], mode: 'insensitive' } } });
        }
        if (!product) return res.status(400).json({ error: 'Product not found' });
        const price = Number(product.price);
        total += price * it.quantity;
        itemsDetailed.push({ productId: product.id, variantId: it.variantId || null, quantity: it.quantity, name: product.name, sku: product.sku, price });
      }

    // create an order record (pending)
    const order = await prisma.order.create({ data: { userId: req.user && req.user.id || null, total, currency: data.currency, status: 'pending', items: { create: itemsDetailed.map(i => ({ productId: i.productId, variantId: i.variantId, name: i.name, sku: i.sku, price: i.price, quantity: i.quantity })) } }, include: { items: true } });

    // create checkout
    const checkout = await komerzaService.createCheckout({
      orderId: order.id,
      amount: total,
      currency: data.currency,
      metadata: {
        orderId: order.id,
        customerEmail: data.customerEmail || null,
        affiliateRef: data.affiliateRef || null
      }
    });

    // attach komerza id to order (best-effort)
    await prisma.order.update({ where: { id: order.id }, data: { komerzaId: checkout.komerzaId } });

    res.status(201).json({ success: true, data: { order: { id: order.id, total: String(order.total), status: order.status }, checkout } });
  } catch (err) { next(err); }
}

async function getOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) { next(err); }
}

module.exports = { createOrder, getOrder };

