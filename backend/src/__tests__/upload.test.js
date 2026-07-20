const request = require('supertest');
process.env.NODE_ENV = 'test';
const app = require('../server');

describe('Upload presign', () => {
  test('returns presigned url in test mode', async () => {
    const payload = { filename: 'file.txt', contentType: 'text/plain', size: 123 };
    const res = await request(app).post('/api/uploads/presign').send(payload).set('Content-Type','application/json');
    expect(res.status).toBe(200);
    expect(res.body.url).toBeDefined();
    expect(res.body.expiresAt).toBeDefined();
  });
});
