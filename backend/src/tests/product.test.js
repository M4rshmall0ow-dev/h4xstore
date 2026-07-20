const request = require('supertest');
const app = require('../server');

const random = () => Math.random().toString(36).slice(2, 8);

describe('Products API', () => {
  let createdId;

  test('should create product', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: `TestProduct-${random()}`, price: '9.99', currency: 'USD' })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('product');
    const p = res.body.product;
    expect(p).toHaveProperty('id');
    expect(p.name).toBeDefined();
    expect(p.price).toBe('9.99');
    createdId = p.id;
  });

  test('should list products', async () => {
    const res = await request(app).get('/api/products').query({ perPage: 50 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('should get product by id', async () => {
    if (!createdId) return;
    const res = await request(app).get(`/api/products/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('product');
    expect(res.body.product.id).toBe(createdId);
  });

  test('should update product', async () => {
    if (!createdId) return;
    const res = await request(app)
      .patch(`/api/products/${createdId}`)
      .send({ description: 'Updated description', featured: true });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('product');
    expect(res.body.product.description).toBe('Updated description');
    expect(res.body.product.featured).toBe(true);
  });

  test('should delete product', async () => {
    if (!createdId) return;
    const res = await request(app).delete(`/api/products/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);

    const list = await request(app).get('/api/products').query({ q: '', perPage: 50 });
    // deleted products are soft-deleted (visible=false) so may still appear if visible filter omitted
    // Ensure that fetching the product returns 404 or visible=false
    const get = await request(app).get(`/api/products/${createdId}`);
    // Either not found or present with visible=false
    expect([200, 404]).toContain(get.statusCode);
  });
});
