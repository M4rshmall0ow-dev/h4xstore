const request = require('supertest');
const app = require('./src/server');
(async () => {
  const paths = ['/', '/Login.html', '/Register.html', '/Dashboard.html', '/api/products', '/_health'];
  for (const p of paths) {
    const res = await request(app).get(p);
    const body = typeof res.body === 'object' ? JSON.stringify(res.body).slice(0, 120) : res.text.slice(0, 120).replace(/\n/g, ' ');
    console.log(`${p} ${res.status} ${body}`);
  }
})();
