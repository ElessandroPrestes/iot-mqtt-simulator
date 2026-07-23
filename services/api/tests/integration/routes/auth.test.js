const request = require('supertest');
const { createApp } = require('../../../src/app');
const mongoose = require('mongoose');

let app;

beforeAll(() => {
  app = createApp();
});

describe('Auth Routes (Integration)', () => {
  const loginPath = '/api/v1/auth/login';

  beforeEach(() => {
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASS = 'admin123';
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.ADMIN_USER;
    delete process.env.ADMIN_PASS;
    delete process.env.JWT_SECRET;
  });

  it('POST /api/v1/auth/login - returns token with valid credentials', async () => {
    const res = await request(app).post(loginPath).send({
      username: 'admin',
      password: 'admin123',
    });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe('string');
  });

  it('POST /api/v1/auth/login - returns 401 with invalid credentials', async () => {
    const res = await request(app).post(loginPath).send({
      username: 'wrong',
      password: 'wrongpassword',
    });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });
});
