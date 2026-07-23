const {
  loadSecurityConfig,
  parseOrigins,
  parsePrincipals,
} = require('../../../src/config/security');

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
});
