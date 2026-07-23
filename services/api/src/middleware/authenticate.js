const jwt = require('jsonwebtoken');
const { loadSecurityConfig } = require('../config/security');
const { auditSecurityEvent } = require('./securityAudit');

function unauthorized(req, res, reason) {
  auditSecurityEvent(req, 'auth.access', 'denied', { reason });
  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      details: [],
    },
  });
}

function verifyAccessToken(token, config) {
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
  if (!principal) throw new Error('Unknown or disabled principal');

  return {
    id: principal.id,
    username: principal.username,
    role: principal.role,
    tokenId: decoded.jti,
  };
}

function createAuthenticate(config) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !/^Bearer [^\s]+$/.test(authHeader)) {
      return unauthorized(req, res, 'missing_or_malformed_bearer');
    }

    const token = authHeader.slice('Bearer '.length);

    try {
      req.user = verifyAccessToken(token, config);
      return next();
    } catch {
      return unauthorized(req, res, 'invalid_access_token');
    }
  };
}

function authenticate(req, res, next) {
  return createAuthenticate(loadSecurityConfig())(req, res, next);
}

module.exports = authenticate;
module.exports.createAuthenticate = createAuthenticate;
module.exports.verifyAccessToken = verifyAccessToken;
