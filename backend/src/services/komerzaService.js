const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/
 * Mocked createCheckout. In a real integration this would call Komerza API.
 * Returns a checkout URL and a komerzaId (checkout id)
 */
async function createCheckout({ orderId, amount, currency = 'USD', metadata = {} }) {
  // generate a fake komerza id and checkout url
  const komerzaId = `kmz_${uuidv4()}`;
  const checkoutUrl = `${config.komerzaBase || 'https://komerza.example.com'}/checkout/${komerzaId}`;
  logger.info(`Komerza.createCheckout order=${orderId} komerzaId=${komerzaId}`);
  return { checkoutUrl, komerzaId };
}

function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  try {
    // normalize header: allow 'sha256=...' or raw hex, trim quotes/whitespace
    let sig = signatureHeader;
    if (typeof sig !== 'string') sig = String(sig);
    sig = sig.trim().replace(/^sha256=/i, '');
    sig = sig.replace(/^"+|"+$/g, '');

    const h = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(h);
    const b = Buffer.from(sig);
    if (a.length !== b.length) {
      logger.warn('komerza signature length mismatch', { expected: a.length, received: b.length, sig });
      return false;
    }
    const ok = crypto.timingSafeEqual(a, b);
    if (!ok) logger.warn('komerza signature mismatch', { expected: h, received: sig });
    return ok;
  } catch (err) {
    logger.warn('Failed verifying komerza signature', err);
    return false;
  }
}

/
 * Handle webhook payloads from Komerza. Expected shape (example):
 * { id: 'evt_...', type: 'checkout.paid', data: { komerzaId: 'kmz_xxx', amount: '9.99', currency: 'USD', metadata: { orderId } } }
 * The function will return { status: 'ok' } when processed or { status: 'ignored' } when nothing to do.
 */
async function handleWebhookEvent(payload, prisma) {
  // basic validation
  if (!payload || !payload.type) return { status: 'ignored' };
  const type = payload.type;
  try {
    if (type === 'checkout.paid') {
      const eventId = payload.id || null;
      const data = payload.data || {};
      const komerzaId = data.komerzaId || data.checkoutId || payload.data?.id;
      const amount = data.amount || data.total;
      const currency = data.currency || 'USD';
      const metadata = data.metadata || {};
      const orderIdFromMetadata = metadata.orderId || metadata.order_id || null;

      // webhook event idempotency: record eventId in WebhookEvent table when possible
      try {
        if (eventId && prisma.webhookEvent) {
          const already = await prisma.webhookEvent.findUnique({ where: { eventId } });
          if (already) {
            await prisma.auditLog.create({ data: { actorId: null, action: 'komerza.webhook.ignored', meta: { eventId, komerzaId, reason: 'event_already_processed' } } });
            return { status: 'ignored' };
          }
        }
      } catch (e) {
        // If the WebhookEvent table doesn't exist yet or another error occurs, continue â€” we'll rely on order-level idempotency
        logger.warn('WebhookEvent check skipped', e.message || e);
      }

      // idempotency: if an order with this komerzaId exists and is paid, ignore
      const existing = await prisma.order.findUnique({ where: { komerzaId } });
      if (existing && existing.status === 'paid') {
        await prisma.auditLog.create({ data: { actorId: null, action: 'komerza.webhook.ignored', meta: { eventId, komerzaId, reason: 'already_paid', orderId: existing.id } } });
        return { status: 'ignored' };
      }

      // Process: upsert order by komerzaId
      let order;
      await prisma.$transaction(async (tx) => {
        // create webhook event record in transaction if possible
        if (eventId && tx.webhookEvent) {
          try {
            await tx.webhookEvent.create({ data: { eventId, source: 'komerza', payload } });
          } catch (e) {
            // unique constraint or missing table -> ignore and continue
            logger.warn('Failed to create webhook event record', e.message || e);
          }
        }

        if (existing) {
          order = await tx.order.update({ where: { id: existing.id }, data: { status: 'paid', receipt: payload } });
        } else if (orderIdFromMetadata) {
          order = await tx.order.update({ where: { id: orderIdFromMetadata }, data: { komerzaId, status: 'paid', receipt: payload } });
        } else {
          order = await tx.order.create({ data: { total: amount || 0, currency, status: 'paid', komerzaId, receipt: payload } });
        }

        // Assign license keys for items in order (if any). Use a service if available
        const licenseService = require('./licenseService');
        try {
          await licenseService.assignKeysForOrder(order.id, tx);
        } catch (e) {
          // If license assignment fails, rollback the transaction by throwing
          logger.error('License assignment failed during webhook processing', e);
          throw e;
        }

        await tx.auditLog.create({ data: { actorId: null, action: 'order.paid', meta: { orderId: order.id, komerzaId, eventId } } });
      });

      return { status: 'ok' };
    }

    // other event types are ignored for now
    await prisma.auditLog.create({ data: { actorId: null, action: 'komerza.webhook.ignored', meta: { type: payload.type } } });
    return { status: 'ignored' };
  } catch (err) {
    logger.error('Error handling komerza webhook', err);
    throw err;
  }
}

module.exports = { createCheckout, verifyWebhookSignature, handleWebhookEvent };

