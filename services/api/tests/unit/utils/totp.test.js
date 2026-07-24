const {
  counterForTime,
  generateTotp,
  verifyTotp,
} = require('../../../src/utils/totp');

describe('TOTP', () => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const timestamp = 1_700_000_010_000;

  it('generates a stable six-digit code for a time window', () => {
    const code = generateTotp(secret, timestamp);

    expect(code).toMatch(/^\d{6}$/);
    expect(generateTotp(secret, timestamp + 29_000)).toBe(code);
  });

  it('accepts only the configured adjacent time window', () => {
    const code = generateTotp(secret, timestamp);

    expect(verifyTotp(secret, code, timestamp, 1)).toEqual({
      valid: true,
      counter: counterForTime(timestamp),
    });
    expect(verifyTotp(secret, code, timestamp + 31_000, 1).valid).toBe(true);
    expect(verifyTotp(secret, code, timestamp + 61_000, 1).valid).toBe(false);
  });

  it('rejects malformed secrets and codes without throwing timing details', () => {
    expect(verifyTotp(secret, '12345', timestamp, 1)).toEqual({ valid: false });
    expect(() => generateTotp('not base32!', timestamp)).toThrow('Invalid TOTP secret');
  });
});
