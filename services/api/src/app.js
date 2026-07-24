const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const compression = require('compression');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const readingsRouter = require('./routes/readings');
const sensorsRouter  = require('./routes/sensors');
const alertsRouter   = require('./routes/alerts');
const healthRouter   = require('./routes/health');
const metricsRouter  = require('./routes/metrics');
const createAuthRouter = require('./routes/auth');
const authenticateModule = require('./middleware/authenticate');
const errorHandler   = require('./middleware/errorHandler');
const logger         = require('./utils/logger');
const { httpRequestDuration } = require('./services/metricsService');
const { loadSecurityConfig } = require('./config/security');
const { auditSecurityEvent } = require('./middleware/securityAudit');

function createApp(options = {}) {
  const app = express();
  const securityConfig = options.securityConfig || loadSecurityConfig();
  const authenticate = typeof authenticateModule.createAuthenticate === 'function'
    ? authenticateModule.createAuthenticate(securityConfig)
    : authenticateModule;

  // ── Security ──────────────────────────────────────────────────
  if (securityConfig.trustProxy) app.set('trust proxy', securityConfig.trustProxy);
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const incomingId = req.get('x-request-id');
    req.id = incomingId && /^[a-zA-Z0-9._-]{8,128}$/.test(incomingId)
      ? incomingId
      : crypto.randomUUID();
    res.setHeader('X-Request-ID', req.id);
    next();
  });
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'none'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  }));
  app.use(cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || securityConfig.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      const error = new Error('Origin is not allowed');
      error.status = 403;
      error.code = 'FORBIDDEN';
      return callback(error);
    },
  }));
  app.use(rateLimit({
    windowMs: 60_000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    handler(req, res) {
      auditSecurityEvent(req, 'http.rate_limit', 'limited');
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          details: [],
          correlationId: req.id,
        },
      });
    },
  }));

  // ── Parsing & Compression ─────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(compression());

  // ── Observabilidade ──────────────────────────────────────────
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
  app.use('/api/v1', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // Prometheus duration tracking
  app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode }));
    next();
  });

  app.use('/health',              healthRouter);
  app.use('/api/v1/health',       healthRouter);
  app.use('/metrics',             metricsRouter);
  const loginLimiter = rateLimit({
    windowMs: securityConfig.loginWindowMs,
    max: securityConfig.loginMaxAttempts,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler(req, res) {
      auditSecurityEvent(req, 'auth.login', 'limited');
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many authentication attempts',
          details: [],
          correlationId: req.id,
        },
      });
    },
  });

  const authRouter = createAuthRouter(securityConfig);
  app.use('/api/v1/auth/login', loginLimiter);
  app.use('/api/v1/auth', authRouter);

  const setupSwagger = require('./config/swagger');
  setupSwagger(app, { enabled: securityConfig.swaggerEnabled });

  // Rotas Protegidas
  app.use('/api/v1/readings',     authenticate, readingsRouter);
  app.use('/api/v1/sensors',      authenticate, sensorsRouter);
  app.use('/api/v1/alerts',       authenticate, alertsRouter);

  app.use((req, res, next) => {
    const error = new Error('Resource not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    next(error);
  });
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
