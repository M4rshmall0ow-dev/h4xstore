const request = require('supertest');
const app = require('../server');

describe('Variants API', () => {
  let productId;
  let variantId;

  test('setup product', async () => {
    const res = await request(app).post('/api/products').send({ name: 'Variant Product', price: '5.00' });
    expect(res.status).toBe(201);
    productId = res.body.product.id;
  });

  test('create variant', async () => {
    const res = await request(app).post(`/api/products/${productId}/variants`).send({ sku: 'V1', name: 'Small', price: '5.00', stock: 10 });
    expect(res.status).toBe(201);
    variantId = res.body.variant.id;
  });

  test('list variants', async () => {
    const res = await request(app).get(`/api/products/${productId}/variants`);
    expect(res.status).toBe(200);
    expect(res.body.items.some(v => v.id === variantId)).toBe(true);
  });

  test('update variant', async () => {
    const res = await request(app).patch(`/api/products/${productId}/variants/${variantId}`).send({ stock: 5 });
    expect(res.status).toBe(200);
    expect(res.body.variant.stock).toBe(5);
  });

  test('delete variant', async () => {
    const res = await request(app).delete(`/api/products/${productId}/variants/${variantId}`);
    expect(res.status).toBe(200);
    const list = await request(app).get(`/api/products/${productId}/variants`);
    expect(list.body.items.some(v => v.id === variantId)).toBe(false);
  });
});
