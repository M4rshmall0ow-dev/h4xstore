const request = require('supertest');

// Ensure test env uses prisma stub
process.env.NODE_ENV = 'test';
process.env.KOMERZA_WEBHOOK_SECRET = 'testsecret';

const crypto = require('crypto');
const app = require('../server');
const prisma = require('../database/prismaClient');

describe('Komerza webhook', () => {
  test('webhook endpoint (test mode) accepts requests', async () => {
    const payload = { id: 'evt_1', type: 'checkout.paid', data: { komerzaId: 'kmz_1', amount: '9.99', currency: 'USD' } };
    const res = await request(app).post('/api/webhooks/komerza').set('x-komerza-signature', 'bad').send(JSON.stringify(payload));
    // In test mode signature checks are bypassed for ease of testing; endpoint should still return 200
    expect(res.status).toBe(200);
  });

  test('processes checkout.paid and is idempotent (second delivery ignored)', async () => {
    const payload = { id: 'evt_2', type: 'checkout.paid', data: { komerzaId: 'kmz_2', amount: '19.99', currency: 'USD' } };
    const raw = JSON.stringify(payload);
    const sig = crypto.createHmac('sha256', process.env.KOMERZA_WEBHOOK_SECRET).update(raw).digest('hex');

    // send raw bytes to match express.raw buffer handling
    const res1 = await request(app).post('/api/webhooks/komerza').set('x-komerza-signature', sig).set('Content-Type','application/json').send(Buffer.from(raw));
    expect(res1.status).toBe(200);

    // second delivery should be ignored (idempotent)
    const res2 = await request(app).post('/api/webhooks/komerza').set('x-komerza-signature', sig).send(raw);
    expect(res2.status).toBe(200);
    expect(res2.body.status).toBe('ignored');
  });
});
