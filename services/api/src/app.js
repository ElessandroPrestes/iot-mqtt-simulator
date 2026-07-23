const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const compression = require('compression');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');

const readingsRouter = require('./routes/readings');
const sensorsRouter  = require('./routes/sensors');
const alertsRouter   = require('./routes/alerts');
const healthRouter   = require('./routes/health');
const metricsRouter  = require('./routes/metrics');
const authRouter     = require('./routes/auth');
const authenticate   = require('./middleware/authenticate');
const errorHandler   = require('./middleware/errorHandler');
const logger         = require('./utils/logger');
const { httpRequestDuration } = require('./services/metricsService');

function createApp() {
  const app = express();

  // ── Security ──────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || '*' }));
  app.use(rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true }));

  // ── Parsing & Compression ─────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(compression());

  // ── Observabilidade ──────────────────────────────────────────
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));

  // Prometheus duration tracking
  app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode }));
    next();
  });

  app.use('/health',              healthRouter);
  app.use('/api/v1/health',       healthRouter);
  app.use('/metrics',             metricsRouter);
  app.use('/api/v1/metrics',      metricsRouter);
  app.use('/api/v1/auth',         authRouter);
  
  const setupSwagger = require('./config/swagger');
  setupSwagger(app);

  
  // Rotas Protegidas
  app.use('/api/v1/readings',     authenticate, readingsRouter);
  app.use('/api/v1/sensors',      authenticate, sensorsRouter);
  app.use('/api/v1/alerts',       authenticate, alertsRouter);

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
