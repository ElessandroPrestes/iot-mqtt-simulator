const {
  loadSecurityConfig,
  parseOrigins,
  parsePrincipals,
} = require('../../../src/config/security');
const argon2 = require('argon2');

describe('security configuration', () => {
  it('rejects wildcard CORS in production', () => {
    expect(() => parseOrigins('*', 'production')).toThrow(
      'CORS_ORIGINS must be an explicit allowlist'
    );
  });

  it('rejects inline principals in production', () => {
    expect(() => parsePrincipals({
      AUTH_PRINCIPALS_JSON: '[]',
    }, 'production')).toThrow('AUTH_PRINCIPALS_JSON is not allowed');
  });

  it('rejects a weak JWT secret', () => {
    expect(() => loadSecurityConfig({
      NODE_ENV: 'test',
      JWT_SECRET: 'short',
    })).toThrow('Invalid security configuration');
  });

  it('loads safe test defaults without production fallbacks', () => {
    const config = loadSecurityConfig({ NODE_ENV: 'test' });

    expect(config.jwtSecret.length).toBeGreaterThanOrEqual(32);
    expect(config.corsOrigins).toEqual(['http://localhost']);
    expect(config.swaggerEnabled).toBe(true);
    expect(config.principals).toEqual([]);
  });

  it('requires TOTP and approved Argon2id parameters for production principals', async () => {
    const strongHash = await argon2.hash('correct horse battery staple', {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
    const weakHash = await argon2.hash('correct horse battery staple', {
      type: argon2.argon2id,
      memoryCost: 4096,
      timeCost: 1,
      parallelism: 1,
    });

    const principal = {
      id: 'operator-1',
      username: 'operator',
      role: 'operator',
      enabled: true,
      securityAdmin: true,
      totpSecret: 'JBSWY3DPEHPK3PXP',
    };

    expect(parsePrincipals({
      AUTH_PRINCIPALS_JSON: JSON.stringify([{
        ...principal,
        passwordHash: strongHash,
      }]),
    }, 'test')).toEqual([expect.objectContaining({
      username: 'operator',
      securityAdmin: true,
    })]);

    expect(() => parsePrincipals({
      AUTH_PRINCIPALS_JSON: JSON.stringify([{
        ...principal,
        passwordHash: weakHash,
      }]),
    }, 'test', { requireMfa: true })).toThrow('Argon2id parameters');

    expect(() => parsePrincipals({
      AUTH_PRINCIPALS_JSON: JSON.stringify([{
        ...principal,
        passwordHash: strongHash,
        totpSecret: undefined,
      }]),
    }, 'test', { requireMfa: true })).toThrow('TOTP');

    expect(() => parsePrincipals({
      AUTH_PRINCIPALS_JSON: JSON.stringify([{
        ...principal,
        passwordHash: strongHash,
        role: 'viewer',
      }]),
    }, 'test', { requireMfa: true })).toThrow('securityAdmin');
  });
});
