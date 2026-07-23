const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('../server');

describe('License keys import', () => {
  test('imports keys via API', async () => {
    const payload = { productId: '11111111-1111-4111-8111-111111111111', keys: ['KEY-ABC', 'KEY-DEF'] };
    const res = await request(app).post('/api/license-keys/import').send(payload).set('Content-Type', 'application/json');
    expect(res.status).toBe(201);
    expect(res.body.imported).toBeGreaterThanOrEqual(1);
  });
});

