const { redact, sanitizeString } = require('../../../src/utils/redact');

describe('log redaction', () => {
  it('redacts sensitive keys recursively without mutating the input', () => {
    const input = {
      accessToken: 'secret-token',
      nested: {
        password: 'secret-password',
        safe: 'visible',
      },
    };

    expect(redact(input)).toEqual({
      accessToken: '[REDACTED]',
      nested: {
        password: '[REDACTED]',
        safe: 'visible',
      },
    });
    expect(input.accessToken).toBe('secret-token');
  });

  it('redacts bearer tokens, JWTs and URI passwords in strings', () => {
    const jwt = 'eyJ1234567890.eyJ1234567890.signature1234567890';
    const value = [
      'Bearer bearer-secret',
      jwt,
      'mongodb://user:database-password@mongo:27017/db',
      'password=query-secret',
    ].join(' ');

    const sanitized = sanitizeString(value);

    expect(sanitized).not.toContain('bearer-secret');
    expect(sanitized).not.toContain(jwt);
    expect(sanitized).not.toContain('database-password');
    expect(sanitized).not.toContain('query-secret');
  });
});
