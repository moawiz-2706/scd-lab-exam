// menu-service/__tests__/index.test.js
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');

// Mock MongoDB connection
jest.mock('mongoose', () => {
  const mMongoose = {
    connect: jest.fn().mockResolvedValue(true),
    Schema: jest.fn().mockReturnValue({
      pre: jest.fn().mockReturnThis(),
      index: jest.fn().mockReturnThis()
    }),
    model: jest.fn().mockReturnValue({
      find: jest.fn().mockResolvedValue([
        { id: '1', name: 'Latte', price: 4.0, stock: 100 },
        { id: '2', name: 'Blueberry Muffin', price: 3.0, stock: 50 }
      ]),
      findOne: jest.fn().mockResolvedValue(
        { id: '1', name: 'Latte', price: 4.0, stock: 100 }
      ),
      countDocuments: jest.fn().mockResolvedValue(2),
      insertMany: jest.fn().mockResolvedValue(true)
    })
  };
  return mMongoose;
});

const app = express();
require('../index');

describe('Menu Service', () => {
  test('GET /menu returns menu items', async () => {
    const response = await request(app).get('/menu');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].name).toBe('Latte');
  });

  test('GET /menu/:id returns a single menu item', async () => {
    const response = await request(app).get('/menu/1');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Latte');
    expect(response.body.price).toBe(4.0);
  });
});