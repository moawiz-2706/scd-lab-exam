// api-gateway/__tests__/index.test.js
const request = require('supertest');
const express = require('express');

// Mock the proxy middleware
jest.mock('http-proxy-middleware', () => {
  return {
    createProxyMiddleware: jest.fn(() => (req, res, next) => {
      res.status(200).json({ message: 'Proxy middleware called' });
    })
  };
});

const app = express();
require('../index');

describe('API Gateway', () => {
  test('Health check returns status UP', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'UP', service: 'API Gateway' });
  });
});