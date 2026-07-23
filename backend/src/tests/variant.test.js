const request = require('supertest');
const app = require('../server');

const random = () => Math.random().toString(36).slice(2, 8);

describe('Variants API', () => {
  let productId;
  let variantId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: `VariantProduct-${random()}`, price: '5.00', currency: 'USD' });
    productId = res.body.product && res.body.product.id;
  });

  test('should create variant for product', async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/variants`)
      .send({ sku: `sku-${random()}`, name: 'Small', price: '5.00', stock: 10 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('variant');
    variantId = res.body.variant.id;
  });

  test('should list variants', async () => {
    const res = await request(app).get(`/api/products/${productId}/variants`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('should update variant', async () => {
    const res = await request(app)
      .patch(`/api/products/${productId}/variants/${variantId}`)
      .send({ name: 'Medium', stock: 8 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('variant');
    expect(res.body.variant.name).toBe('Medium');
  });

  test('should delete variant', async () => {
    const res = await request(app).delete(`/api/products/${productId}/variants/${variantId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});

