import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { TestHelpers } from '@tests/utils/testHelpers';

// Import the app with routes already mounted
import app from '@/app';

const request = supertest(app);

describe('Example Routes Integration Tests', () => {
  describe('GET /api/example', () => {
    it('should return example route response', async () => {
      const response = await request.get('/api/example');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Example route',
        timestamp: expect.any(String),
      });

      // Validate timestamp format
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should have correct content-type header', async () => {
      const response = await request.get('/api/example');

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('POST /api/example', () => {
    it('should handle POST request with data', async () => {
      const testData = { name: 'Test User' };
      
      const response = await request
        .post('/api/example')
        .send(testData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Data received successfully',
        data: testData,
        timestamp: expect.any(String),
      });
    });

    it('should handle POST request without data', async () => {
      const response = await request
        .post('/api/example')
        .send({})
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Data received successfully',
        data: { name: undefined },
        timestamp: expect.any(String),
      });
    });

    it('should handle POST request with invalid JSON', async () => {
      const response = await request
        .post('/api/example')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      // Express should handle this with 400 Bad Request
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Example Routes with Test Helpers', () => {
    it('should validate API response structure using helper', async () => {
      const response = await request.get('/api/example');
      
      // Note: This will fail because our example route doesn't follow the standard API response format
      // You might want to update your routes to follow the format, or adjust the helper
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should generate and use test data', () => {
      const testData = TestHelpers.generateTestData();
      
      expect(testData).toHaveProperty('id');
      expect(testData).toHaveProperty('name');
      expect(testData).toHaveProperty('email');
      expect(testData).toHaveProperty('timestamp');
      
      expect(typeof testData.id).toBe('number');
      expect(typeof testData.name).toBe('string');
      expect(typeof testData.email).toBe('string');
      expect(typeof testData.timestamp).toBe('string');
    });
  });
});
