const request = require('supertest');
const app = require('../server');
const Product = require('../models').Product;
const { createToken } = require('../services/AuthService');

describe('ProductController', () => {
  let token;
  let testProduct;

  beforeAll(async () => {
    // Create a test user and get JWT token
    token = createToken({ userId: 'test-user-id' });

    // Create a test product
    testProduct = await Product.create({
      name: 'Test Product',
      description: 'Test Description',
      price: 9.99,
      category: 'Test Category',
      variants: [{ id: 'v1', color: 'Red' }]
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Product.destroy({ where: { id: testProduct.id } });
  });

  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.any(Array));
      expect(response.body.some(p => p.id === testProduct.id)).toBe(true);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a product by ID', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testProduct.id);
      expect(response.body.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/non-existent-id')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Product',
        description: 'New Description',
        price: 19.99,
        category: 'New Category',
        variants: [{ id: 'v2', color: 'Blue' }]
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(newProduct);
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Product');

      // Clean up
      await Product.destroy({ where: { id: response.body.id } });
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update a product', async () => {
      const updates = { name: 'Updated Product' };
      
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Product');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete a product', async () => {
      const productToDelete = await Product.create({
        name: 'Delete Me',
        description: 'To be deleted',
        price: 5.99,
        category: 'Test'
      });

      const response = await request(app)
        .delete(`/api/products/${productToDelete.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(204);

      // Verify deletion
      const deletedProduct = await Product.findByPk(productToDelete.id);
      expect(deletedProduct).toBeNull();
    });
  });
});