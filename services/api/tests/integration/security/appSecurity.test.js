const request = require('supertest');
const { createApp } = require('../../../src/app');

jest.mock('../../../src/middleware/authenticate', () => {
  const authenticate = (req, res, next) => next();
  authenticate.createAuthenticate = () => authenticate;
  return authenticate;
});

const securityConfig = {
  environment: 'production',
  production: true,
  jwtSecret: 'production-test-secret-with-at-least-32-bytes',
  jwtIssuer: 'iot-api',
  jwtAudience: 'iot-dashboard',
  accessTokenTtlSeconds: 900,
  refreshTokenTtlSeconds: 28800,
  loginWindowMs: 900000,
  loginMaxAttempts: 5,
  principals: [],
  corsOrigins: ['https://iot.example.test'],
  swaggerEnabled: false,
  trustProxy: 1,
  refreshCookieName: '__Host-refresh',
  secureCookies: true,
};

describe('application security policy', () => {
  const app = createApp({ securityConfig });

  it('sets modern security headers and a correlation ID', async () => {
    const response = await request(app)
      .get('/health')
      .set('X-Request-ID', 'security-request-123');

    expect(response.headers['x-request-id']).toBe('security-request-123');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('rejects an origin outside the explicit allowlist', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://attacker.example');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(response.body.error.correlationId).toBeDefined();
  });

  it('does not expose Swagger or versioned metrics in production', async () => {
    const docs = await request(app).get('/api/docs');
    const metrics = await request(app).get('/api/v1/metrics');

    expect(docs.status).toBe(404);
    expect(metrics.status).toBe(404);
  });

  it('prevents storage of authenticated responses, including validation errors', async () => {
    const response = await request(app).get('/api/v1/readings?limit=0');

    expect(response.status).toBe(400);
    expect(response.headers['cache-control']).toBe('no-store');
  });
});
