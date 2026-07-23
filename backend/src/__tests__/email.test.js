const request = require('supertest');
process.env.NODE_ENV = 'test';
const app = require('../server');
const emailService = require('../services/emailService');

describe('Email API', () => {
  beforeEach(() => { emailService._clearSent(); });

  test('send mail endpoint enqueues mail in test mode', async () => {
    const payload = { to: 'test@example.com', subject: 'Hello', text: 'Hi' };
    const res = await request(app).post('/api/mailbox/send').send(payload).set('Content-Type','application/json');
    expect(res.status).toBe(202);
    const sent = emailService._getSent();
    expect(sent.length).toBe(1);
    expect(sent[0].to).toBe('test@example.com');
  });
});
