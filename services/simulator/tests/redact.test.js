import { describe, expect, it } from '@jest/globals';
import { redact } from '../src/redact.js';

describe('redact', () => {
  it('redacts secret keys recursively', () => {
    expect(redact({
      connectionString: 'HostName=test;SharedAccessKey=secret',
      nested: {
        sharedAccessKey: 'secret',
        clientKey: 'secret',
        safe: 'visible',
      },
      list: [{ token: 'secret' }],
    })).toEqual({
      connectionString: '[REDACTED]',
      nested: {
        sharedAccessKey: '[REDACTED]',
        clientKey: '[REDACTED]',
        safe: 'visible',
      },
      list: [{ token: '[REDACTED]' }],
    });
  });

  it('redacts secret values inside otherwise safe strings', () => {
    expect(redact({
      error:
        'HostName=test;DeviceId=gateway;SharedAccessKey=secret;sig=signature&se=1',
      detail: 'password=secret;',
      signature: 'SharedAccessSignature=secret&sig=secret&sas=secret',
    })).toEqual({
      error: 'HostName=test;DeviceId=gateway;SharedAccessKey=[REDACTED];sig=[REDACTED]&se=1',
      detail: 'password=[REDACTED];',
      signature: 'SharedAccessSignature=[REDACTED]&sig=[REDACTED]&sas=[REDACTED]',
    });
  });

  it('handles dates, errors, shared references and cycles', () => {
    const shared = { safe: 'visible' };
    const cycle = { safe: 'visible' };
    cycle.self = cycle;

    const result = redact({
      date: new Date('2026-10-23T00:00:00.000Z'),
      error: new Error('SharedAccessKey=secret'),
      first: shared,
      second: shared,
      cycle,
    });

    expect(result.date).toBe('2026-10-23T00:00:00.000Z');
    expect(result.error).toEqual({
      name: 'Error',
      message: 'SharedAccessKey=[REDACTED]',
    });
    expect(result.first).toEqual({ safe: 'visible' });
    expect(result.second).toEqual({ safe: 'visible' });
    expect(result.cycle.self).toBe('[Circular]');
  });
});
