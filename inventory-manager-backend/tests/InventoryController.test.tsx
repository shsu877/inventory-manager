const request = require('supertest');
const app = require('../server');
const { Product, Inventory } = require('../models');
const { createToken } = require('../services/AuthService');

describe('InventoryController', () => {
  let token;
  let testProduct;
  let testInventory;

  beforeAll(async () => {
    token = createToken({ userId: 'test-user-id' });

    // Create test product and inventory
    testProduct = await Product.create({
      name: 'Test Inventory Product',
      description: 'Test Description',
      price: 14.99,
      category: 'Test',
      variants: [{ id: 'v1', color: 'Blue' }]
    });

    testInventory = await Inventory.create({
      productId: testProduct.id,
      variantId: 'v1',
      quantityOnHand: 100
    });
  });

  afterAll(async () => {
    await Inventory.destroy({ where: { id: testInventory.id } });
    await Product.destroy({ where: { id: testProduct.id } });
  });

  describe('GET /api/inventory', () => {
    it('should return all inventory items', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.any(Array));
      expect(response.body.some(i => i.productId === testProduct.id)).toBe(true);
    });
  });

  describe('GET /api/inventory/:productId/:variantId', () => {
    it('should return inventory for specific variant', async () => {
      const response = await request(app)
        .get(`/api/inventory/${testProduct.id}/v1`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.quantityOnHand).toBe(100);
    });

    it('should return 404 for non-existent inventory', async () => {
      const response = await request(app)
        .get('/api/inventory/999/v999')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/inventory', () => {
    it('should create/update inventory', async () => {
      const newInventory = {
        productId: testProduct.id,
        variantId: 'v2',
        quantityOnHand: 50
      };

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send(newInventory);
      
      expect(response.status).toBe(200);
      expect(response.body.quantityOnHand).toBe(50);

      // Clean up
      await Inventory.destroy({ where: { id: response.body.id } });
    });
  });

  describe('PUT /api/inventory', () => {
    it('should adjust inventory quantity', async () => {
      const adjustment = {
        productId: testProduct.id,
        variantId: 'v1',
        adjustment: -10
      };

      const response = await request(app)
        .put('/api/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send(adjustment);
      
      expect(response.status).toBe(200);
      expect(response.body.quantityOnHand).toBe(90);
    });

    it('should handle invalid adjustment', async () => {
      const response = await request(app)
        .put('/api/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: 'invalid', variantId: 'invalid', adjustment: 'invalid' });
      
      expect(response.status).toBe(400);
    });
  });
});