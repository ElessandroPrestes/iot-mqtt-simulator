const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { createApp } = require('../../../src/app');
const { generateTotp } = require('../../../src/utils/totp');
const Session = require('../../../src/models/Session');

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
  let passwordHash;

  beforeAll(async () => {
    passwordHash = await argon2.hash('correct horse battery staple', {
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
      mfaRequired: false,
      sessionIdleTtlSeconds: 1800,
      maxConcurrentSessions: 3,
      principals: [{
        id: 'operator-1',
        username: 'operator',
        passwordHash,
        role: 'operator',
        enabled: true,
        securityAdmin: true,
        totpSecret: 'JBSWY3DPEHPK3PXP',
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
    const decoded = jwt.decode(response.body.data.accessToken, { complete: true });
    expect(decoded.header.typ).toBe('at+jwt');
    expect(decoded.payload.sid).toMatch(/^[0-9a-f-]{36}$/);
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
    for (const response of [wrongUser, wrongPassword]) {
      expect(response.body.error).toEqual(expect.objectContaining({
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials or session',
        details: [],
      }));
      expect(response.body.error.correlationId).toBeDefined();
    }
  });

  it('requires TOTP in production mode and rejects replay of a used code', async () => {
    const mfaApp = createApp({
      securityConfig: {
        ...securityConfig,
        mfaRequired: true,
      },
    });
    const code = generateTotp('JBSWY3DPEHPK3PXP');

    const login = () => request(mfaApp)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({
        username: 'operator',
        password: 'correct horse battery staple',
        totp: code,
      });

    const accepted = await login();
    const replayed = await login();
    const missing = await request(mfaApp)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({
        username: 'operator',
        password: 'correct horse battery staple',
      });

    expect(accepted.status).toBe(200);
    expect(replayed.status).toBe(401);
    expect(missing.status).toBe(401);
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

  it('invalidates the access token immediately after logout', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({
        username: 'operator',
        password: 'correct horse battery staple',
      });
    const token = login.body.data.accessToken;
    const cookie = cookiePair(login);

    const beforeLogout = await request(app)
      .get('/api/v1/readings')
      .set('Authorization', `Bearer ${token}`);
    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set(BROWSER_HEADERS)
      .set('Cookie', cookie)
      .send({});
    const afterLogout = await request(app)
      .get('/api/v1/readings')
      .set('Authorization', `Bearer ${token}`);

    expect(beforeLogout.status).toBe(200);
    expect(logout.status).toBe(200);
    expect(afterLogout.status).toBe(401);
  });

  it('lists and revokes the current principal sessions', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({
        username: 'operator',
        password: 'correct horse battery staple',
      });
    const token = login.body.data.accessToken;

    const listed = await request(app)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${token}`);
    const familyId = listed.body.data[0].familyId;
    const revoked = await request(app)
      .delete(`/api/v1/auth/sessions/${familyId}`)
      .set(BROWSER_HEADERS)
      .set('Authorization', `Bearer ${token}`);
    const denied = await request(app)
      .get('/api/v1/readings')
      .set('Authorization', `Bearer ${token}`);

    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(1);
    expect(revoked.status).toBe(200);
    expect(denied.status).toBe(401);
  });

  it('rejects an access token after the inactivity deadline', async () => {
    const idleApp = createApp({
      securityConfig: {
        ...securityConfig,
        sessionIdleTtlSeconds: 60,
      },
    });
    const login = await request(idleApp)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({
        username: 'operator',
        password: 'correct horse battery staple',
      });
    const token = login.body.data.accessToken;
    const { sid } = jwt.decode(token);

    await Session.updateMany(
      { familyId: sid },
      { $set: { lastActivityAt: new Date(Date.now() - 61_000) } }
    );

    const denied = await request(idleApp)
      .get('/api/v1/readings')
      .set('Authorization', `Bearer ${token}`);

    expect(denied.status).toBe(401);
  });

  it('enforces the configured concurrent session limit', async () => {
    const limitedApp = createApp({
      securityConfig: {
        ...securityConfig,
        maxConcurrentSessions: 1,
      },
    });
    const credentials = {
      username: 'operator',
      password: 'correct horse battery staple',
    };

    const responses = await Promise.all([
      request(limitedApp)
        .post('/api/v1/auth/login')
        .set(BROWSER_HEADERS)
        .send(credentials),
      request(limitedApp)
        .post('/api/v1/auth/login')
        .set(BROWSER_HEADERS)
        .send(credentials),
    ]);

    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
    expect(responses.find(({ status }) => status === 409).body.error.code)
      .toBe('SESSION_LIMIT');
  });

  it('allows only a security admin to revoke another principal session', async () => {
    const adminApp = createApp({
      securityConfig: {
        ...securityConfig,
        principals: [
          securityConfig.principals[0],
          {
            id: 'viewer-1',
            username: 'viewer',
            passwordHash,
            role: 'viewer',
            enabled: true,
            securityAdmin: false,
          },
        ],
      },
    });
    const viewerLogin = await request(adminApp)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({
        username: 'viewer',
        password: 'correct horse battery staple',
      });
    const adminLogin = await request(adminApp)
      .post('/api/v1/auth/login')
      .set(BROWSER_HEADERS)
      .send({
        username: 'operator',
        password: 'correct horse battery staple',
      });
    const viewerToken = viewerLogin.body.data.accessToken;
    const adminToken = adminLogin.body.data.accessToken;
    const { sid: viewerFamily } = jwt.decode(viewerToken);

    const revoked = await request(adminApp)
      .delete(`/api/v1/auth/admin/sessions/viewer-1/${viewerFamily}`)
      .set(BROWSER_HEADERS)
      .set('Authorization', `Bearer ${adminToken}`);
    const denied = await request(adminApp)
      .get('/api/v1/readings')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(revoked.status).toBe(200);
    expect(denied.status).toBe(401);
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
