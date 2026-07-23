jest.mock('../../../src/utils/logger', () => ({ info: jest.fn() }));
jest.mock('../../../src/services/metricsService', () => ({
  securityEventsTotal: { inc: jest.fn() },
}));

const logger = require('../../../src/utils/logger');
const { securityEventsTotal } = require('../../../src/services/metricsService');
const { auditSecurityEvent } = require('../../../src/middleware/securityAudit');

describe('securityAudit', () => {
  it('emits a bounded metric and a correlated structured event', () => {
    const req = {
      id: 'request-123',
      ip: '127.0.0.1',
      user: { id: 'viewer-1', role: 'viewer' },
    };

    auditSecurityEvent(req, 'auth.access', 'denied', { reason: 'invalid' });

    expect(securityEventsTotal.inc).toHaveBeenCalledWith({
      event: 'auth.access',
      outcome: 'denied',
    });
    expect(logger.info).toHaveBeenCalledWith(
      'Security audit event',
      expect.objectContaining({
        correlationId: 'request-123',
        event: 'auth.access',
        outcome: 'denied',
        principalId: 'viewer-1',
      })
    );
  });

  it('rejects unbounded event and outcome values', () => {
    expect(() => auditSecurityEvent({}, '../invalid', 'success')).toThrow();
    expect(() => auditSecurityEvent({}, 'auth.valid', 'unknown')).toThrow();
  });
});
