const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const authService = require('../services/authService');
const { parseCookies, serializeRefreshCookie } = require('../utils/cookies');
const { successResponse } = require('../utils/responseFormatter');
const { auditSecurityEvent } = require('../middleware/securityAudit');

const loginSchema = Joi.object({
  username: Joi.string().trim().min(3).max(64).pattern(/^[a-zA-Z0-9._-]+$/).required(),
  password: Joi.string().min(8).max(256).required(),
}).unknown(false);

function setRefreshCookie(res, token, config) {
  res.setHeader('Set-Cookie', serializeRefreshCookie(
    config.refreshCookieName,
    token,
    {
      maxAgeSeconds: config.refreshTokenTtlSeconds,
      secure: config.secureCookies,
    }
  ));
}

function clearRefreshCookie(res, config) {
  res.setHeader('Set-Cookie', serializeRefreshCookie(
    config.refreshCookieName,
    '',
    { maxAgeSeconds: 0, secure: config.secureCookies }
  ));
}

function requireTrustedBrowserRequest(config) {
  return (req, res, next) => {
    const origin = req.get('origin');
    const requestedWith = req.get('x-requested-with');

    if ((origin && !config.corsOrigins.includes(origin))
      || (config.production && !origin)
      || requestedWith !== 'XMLHttpRequest') {
      auditSecurityEvent(req, 'auth.browser_request', 'denied');
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Request origin is not allowed',
          details: [],
          correlationId: req.id,
        },
      });
    }

    return next();
  };
}

function createAuthRouter(config) {
  const router = express.Router();
  const trustedBrowser = requireTrustedBrowserRequest(config);

  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     summary: Autentica um principal e inicia uma sessão rotativa.
   *     tags: [Auth]
   */
  router.post('/login', trustedBrowser, validate(loginSchema), async (req, res, next) => {
    try {
      const principal = await authService.authenticateCredentials(
        req.body.username,
        req.body.password,
        config
      );
      const session = await authService.createSession(principal, config);
      setRefreshCookie(res, session.refreshToken, config);
      req.user = principal;
      auditSecurityEvent(req, 'auth.login', 'success');

      return res.json(successResponse({
        accessToken: session.accessToken,
        expiresIn: config.accessTokenTtlSeconds,
        user: session.principal,
      }));
    } catch (error) {
      auditSecurityEvent(req, 'auth.login', 'failure');
      return next(error);
    }
  });

  router.post('/refresh', trustedBrowser, async (req, res, next) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const session = await authService.rotateSession(
        cookies[config.refreshCookieName],
        config
      );
      setRefreshCookie(res, session.refreshToken, config);
      req.user = session.principal;
      auditSecurityEvent(req, 'auth.refresh', 'success');

      return res.json(successResponse({
        accessToken: session.accessToken,
        expiresIn: config.accessTokenTtlSeconds,
        user: session.principal,
      }));
    } catch (error) {
      clearRefreshCookie(res, config);
      auditSecurityEvent(req, 'auth.refresh', 'failure');
      return next(error);
    }
  });

  router.post('/logout', trustedBrowser, async (req, res, next) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      await authService.revokeSession(cookies[config.refreshCookieName]);
      clearRefreshCookie(res, config);
      auditSecurityEvent(req, 'auth.logout', 'success');
      return res.json(successResponse(null));
    } catch (error) {
      auditSecurityEvent(req, 'auth.logout', 'failure');
      return next(error);
    }
  });

  return router;
}

module.exports = createAuthRouter;
module.exports.loginSchema = loginSchema;
module.exports.requireTrustedBrowserRequest = requireTrustedBrowserRequest;
