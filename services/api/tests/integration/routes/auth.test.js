const argon2 = require('argon2');
const request = require('supertest');
const { createApp } = require('../../../src/app');

const BROWSER_HEADERS = {
  Origin: 'http://localhost',
  'X-Requested-With': 'XMLHttpRequest',
};

function cookiePair(response) {
  return response.headers['set-cookie'][0].split(';')[0];
}

describe('Auth Routes (Integration)', () => {
  let app;
  let securityConfig;

  beforeAll(async () => {
    const passwordHash = await argon2.hash('correct horse battery staple', {
      type: argon2.argon2id,
    });

    securityConfig = {
      environment: 'test',
      production: false,
      jwtSecret: 'test-only-jwt-secret-with-32-bytes-minimum',
      jwtIssuer: 'iot-api-test',
      jwtAudience: 'iot-dashboard-test',
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 28_800,
      loginWindowMs: 900_000,
      loginMaxAttempts: 5,
      corsOrigins: ['http://localhost'],
      swaggerEnabled: false,
      trustProxy: false,
      refreshCookieName: 'refresh_token',
      secureCookies: false,
      principals: [{
        id: 'operator-1',
        username: 'operator',
        passwordHash,
        role: 'operator',
        enabled: true,
      }],
    };
    app = createApp({ securityConfig });
  });

  it('returns access token and protected refresh cookie with valid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({
        username: 'operator',
        password: 'correct horse battery staple',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.user).toEqual({
      id: 'operator-1',
      username: 'operator',
      role: 'operator',
    });
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Strict');
    expect(response.body.data).not.toHaveProperty('refreshToken');
  });

  it('returns the same generic 401 for invalid username or password', async () => {
    const wrongUser = await request(app)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({ username: 'unknown', password: 'wrong-password' });
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({ username: 'operator', password: 'wrong-password' });

    expect(wrongUser.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(wrongUser.body).toEqual(wrongPassword.body);
    expect(wrongUser.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects unknown fields and untrusted browser requests', async () => {
    const unknownField = await request(app)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({
        username: 'operator',
        password: 'correct horse battery staple',
        role: 'operator',
      });
    const untrustedOrigin = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'https://evil.example')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        username: 'operator',
        password: 'correct horse battery staple',
      });

    expect(unknownField.status).toBe(400);
    expect(unknownField.body.error.code).toBe('VALIDATION_ERROR');
    expect(untrustedOrigin.status).toBe(403);
  });

  it('rotates refresh token and revokes the family when an old token is replayed', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({
        username: 'operator',
        password: 'correct horse battery staple',
      });
    const originalCookie = cookiePair(login);

    const refresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set(BROWSER_HEADERS)
      .set('Cookie', originalCookie)
      .send({});
    const rotatedCookie = cookiePair(refresh);

    expect(refresh.status).toBe(200);
    expect(rotatedCookie).not.toBe(originalCookie);

    const replay = await request(app)
      .post('/api/v1/auth/refresh')
      .set(BROWSER_HEADERS)
      .set('Cookie', originalCookie)
      .send({});
    expect(replay.status).toBe(401);

    const revokedFamily = await request(app)
      .post('/api/v1/auth/refresh')
      .set(BROWSER_HEADERS)
      .set('Cookie', rotatedCookie)
      .send({});
    expect(revokedFamily.status).toBe(401);
  });

  it('revokes refresh family on logout', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({
        username: 'operator',
        password: 'correct horse battery staple',
      });
    const cookie = cookiePair(login);

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set(BROWSER_HEADERS)
      .set('Cookie', cookie)
      .send({});
    expect(logout.status).toBe(200);
    expect(logout.headers['set-cookie'][0]).toContain('Max-Age=0');

    const refresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set(BROWSER_HEADERS)
      .set('Cookie', cookie)
      .send({});
    expect(refresh.status).toBe(401);
  });

  it('rate-limits repeated failed login attempts', async () => {
    const limitedApp = createApp({
      securityConfig: {
        ...securityConfig,
        loginMaxAttempts: 2,
      },
    });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await request(limitedApp)
        .post('/api/v1/auth/login')
        .set(BROWSER_HEADERS)
        .send({ username: 'unknown', password: 'wrong-password' });
      expect(response.status).toBe(401);
    }

    const blocked = await request(limitedApp)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({ username: 'unknown', password: 'wrong-password' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });
});
