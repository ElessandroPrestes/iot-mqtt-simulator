const request = require('supertest');
const { createApp } = require('../../../src/app');

jest.mock('../../../src/middleware/authenticate', () => {
  const authenticate = (req, res, next) => next();
  authenticate.createAuthenticate = () => authenticate;
  return authenticate;
});

const securityConfig = {
  environment: 'test',
  production: false,
  jwtSecret: 'swagger-test-secret-with-at-least-32-bytes',
  jwtIssuer: 'iot-api',
  jwtAudience: 'iot-dashboard',
  accessTokenTtlSeconds: 900,
  refreshTokenTtlSeconds: 28800,
  loginWindowMs: 900000,
  loginMaxAttempts: 5,
  principals: [],
  corsOrigins: ['http://localhost'],
  swaggerEnabled: true,
  trustProxy: false,
  refreshCookieName: 'refresh_token',
  secureCookies: false,
};

describe('OpenAPI documentation', () => {
  const app = createApp({ securityConfig });

  it('serves Swagger UI when explicitly enabled', async () => {
    const response = await request(app).get('/api/docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Swagger UI');
  });

  it('publishes the approved schemas, security scheme and every versioned route', async () => {
    const response = await request(app).get('/api/docs/swagger-ui-init.js');

    expect(response.status).toBe(200);

    const requiredFragments = [
      '"openapi": "3.0.0"',
      '"Reading"',
      '"Alert"',
      '"SuccessResponse"',
      '"ErrorResponse"',
      '"bearerAuth"',
      '"/api/v1/health"',
      '"/api/v1/auth/login"',
      '"/api/v1/auth/refresh"',
      '"/api/v1/auth/logout"',
      '"/api/v1/auth/sessions"',
      '"/api/v1/auth/sessions/{familyId}"',
      '"/api/v1/auth/admin/sessions/{principalId}/{familyId}"',
      '"/api/v1/readings"',
      '"/api/v1/readings/latest"',
      '"/api/v1/readings/stats"',
      '"/api/v1/sensors"',
      '"/api/v1/sensors/{id}"',
      '"/api/v1/alerts"',
      '"/api/v1/alerts/summary"',
      '"/api/v1/alerts/{id}/resolve"',
    ];

    requiredFragments.forEach((fragment) => {
      expect(response.text).toContain(fragment);
    });
  });
});
