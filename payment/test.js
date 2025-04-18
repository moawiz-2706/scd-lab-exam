// payment-service/__tests__/index.test.js
const mongoose = require('mongoose');
const axios = require('axios');
const request = require('supertest');
const express = require('express');

// Mock MongoDB
jest.mock('mongoose');
// Mock axios requests
jest.mock('axios');

const app = express();
require('../index');

describe('Payment Service', () => {
  test('Health check returns status UP', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'UP', service: 'Payment Service' });
  });
});