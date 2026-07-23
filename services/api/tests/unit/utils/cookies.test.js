const {
  parseCookies,
  serializeRefreshCookie,
} = require('../../../src/utils/cookies');

describe('cookie helpers', () => {
  it('parses encoded cookie values', () => {
    expect(parseCookies('a=1; refresh_token=a%20b')).toEqual({
      a: '1',
      refresh_token: 'a b',
    });
  });

  it('serializes a secure HttpOnly refresh cookie', () => {
    const cookie = serializeRefreshCookie('__Host-refresh', 'token', {
      maxAgeSeconds: 100,
      secure: true,
    });

    expect(cookie).toContain('__Host-refresh=token');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('Max-Age=100');
  });
});
