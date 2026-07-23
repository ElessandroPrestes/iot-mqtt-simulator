const jwt = require('jsonwebtoken');
const { loadSecurityConfig } = require('../config/security');

function unauthorized(res) {
  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      details: [],
    },
  });
}

function createAuthenticate(config) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !/^Bearer [^\s]+$/.test(authHeader)) {
      return unauthorized(res);
    }

    const token = authHeader.slice('Bearer '.length);

    try {
      const decoded = jwt.verify(token, config.jwtSecret, {
        algorithms: ['HS256'],
        audience: config.jwtAudience,
        issuer: config.jwtIssuer,
      });

      const principal = config.principals.find(
        (candidate) => candidate.enabled
          && candidate.id === decoded.sub
          && candidate.role === decoded.role
      );
      if (!principal) return unauthorized(res);

      req.user = {
        id: principal.id,
        username: principal.username,
        role: principal.role,
        tokenId: decoded.jti,
      };
      return next();
    } catch {
      return unauthorized(res);
    }
  };
}

function authenticate(req, res, next) {
  return createAuthenticate(loadSecurityConfig())(req, res, next);
}

module.exports = authenticate;
module.exports.createAuthenticate = createAuthenticate;
