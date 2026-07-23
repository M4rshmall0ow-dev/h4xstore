const request = require('supertest');
const app = require('../server');

describe('Products API', () => {
  let createdId;

  test('should create product', async () => {
    const res = await request(app).post('/api/products').send({ name: 'Test Product', price: '9.99', currency: 'USD' });
    expect(res.status).toBe(201);
    expect(res.body.product).toBeDefined();
    expect(res.body.product.name).toBe('Test Product');
    createdId = res.body.product.id;
  });

  test('should list products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.items.some(p => p.id === createdId)).toBe(true);
  });

  test('should get product by id', async () => {
    const res = await request(app).get(`/api/products/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.product).toBeDefined();
    expect(res.body.product.id).toBe(createdId);
    expect(Array.isArray(res.body.product.variants)).toBe(true);
  });

  test('should update product', async () => {
    const res = await request(app).patch(`/api/products/${createdId}`).send({ featured: true });
    expect(res.status).toBe(200);
    expect(res.body.product.featured).toBe(true);
  });

  test('should delete product (soft)', async () => {
    const res = await request(app).delete(`/api/products/${createdId}`);
    expect(res.status).toBe(200);
    const list = await request(app).get('/api/products');
    expect(list.body.items.some(p => p.id === createdId)).toBe(false);
  });
});
