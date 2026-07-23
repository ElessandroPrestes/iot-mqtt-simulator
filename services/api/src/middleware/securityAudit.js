const logger = require('../utils/logger');
const { securityEventsTotal } = require('../services/metricsService');

const EVENT_PATTERN = /^[a-z][a-z0-9_.-]{2,63}$/;
const OUTCOMES = new Set(['success', 'failure', 'denied', 'limited']);

function auditSecurityEvent(req, event, outcome, metadata = {}) {
  if (!EVENT_PATTERN.test(event) || !OUTCOMES.has(outcome)) {
    throw new Error('Invalid security audit event');
  }

  securityEventsTotal.inc({ event, outcome });
  logger.info('Security audit event', {
    event,
    outcome,
    correlationId: req?.id,
    principalId: req?.user?.id,
    role: req?.user?.role,
    ip: req?.ip,
    ...metadata,
  });
}

module.exports = { auditSecurityEvent };
