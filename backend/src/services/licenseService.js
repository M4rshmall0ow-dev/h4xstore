const logger = require('../utils/logger');

/*
 * assignKeysForOrder(orderId, prismaTxClient)
 * - prismaTxClient: a Prisma transaction client (tx) passed from $transaction
 * - scans order items and assigns available license keys for products referenced
 */
async function assignKeysForOrder(orderId, prismaTxClient) {
  const tx = prismaTxClient;
  if (!tx) throw new Error('Prisma transaction client is required');

  // fetch order with items
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error('Order not found');

  const assigned = [];
  for (const item of order.items) {
    // try to assign as many keys as quantity
    for (let i = 0; i < item.quantity; i++) {
      // find first available key for product
      const key = await tx.licenseKey.findFirst({ where: { productId: item.productId, used: false, reserved: false } });
      if (!key) {
        // no key available -> throw to rollback
        throw new Error(`No license keys available for product ${item.productId}`);
      }
      // reserve it
      await tx.licenseKey.update({ where: { id: key.id }, data: { reserved: true, reservedAt: new Date() } });
      assigned.push(key);
    }
  }

  // finalize assignment
  for (const key of assigned) {
    await tx.licenseKey.update({ where: { id: key.id }, data: { orderId: order.id, assignedToId: order.userId || null, used: true, usedAt: new Date(), reserved: false } });
  }

  logger.info(`Assigned ${assigned.length} license keys for order ${orderId}`);
  return assigned.length;
}

async function importKeys({ productId, keys = [], prisma }) {
  if (!prisma) throw new Error('Prisma client is required');
  if (!Array.isArray(keys)) throw new Error('keys must be an array');
  const data = keys.map(k => ({ key: k, productId }));
  // use createMany if available
  if (prisma.licenseKey.createMany) {
    const res = await prisma.licenseKey.createMany({ data, skipDuplicates: true });
    return { imported: res.count || keys.length };
  }
  // fallback: loop
  let imported = 0;
  for (const d of data) {
    try {
      await prisma.licenseKey.create({ data: d });
      imported++;
    } catch (e) {
      // skip duplicates
    }
  }
  return { imported };
}

module.exports = { assignKeysForOrder, importKeys };

