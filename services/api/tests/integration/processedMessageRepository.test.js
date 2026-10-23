const ProcessedMessage = require('../../src/models/ProcessedMessage');
const repository = require('../../src/repositories/processedMessageRepository');

describe('processedMessageRepository', () => {
  beforeAll(async () => {
    await ProcessedMessage.init();
  });

  afterEach(async () => {
    await ProcessedMessage.deleteMany({});
  });

  it('claims a message only once while its lease is valid', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const options = { source: 'azure', sensorId: 'TEMP-01', now };

    expect(await repository.claim('azure:msg-1', options)).toBe(true);
    expect(await repository.claim('azure:msg-1', options)).toBe(false);

    const stored = await ProcessedMessage.findById('azure:msg-1').lean();
    expect(stored).toMatchObject({
      source: 'azure',
      sensorId: 'TEMP-01',
      status: 'processing',
      claimedAt: now,
    });
    expect(stored.leaseUntil.getTime()).toBeGreaterThan(now.getTime());
    expect(stored.expiresAt.getTime()).toBeGreaterThan(stored.leaseUntil.getTime());
  });

  it('does not reclaim a completed message', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    await repository.claim('azure:msg-2', { source: 'azure', sensorId: 'TEMP-01', now });
    await repository.complete('azure:msg-2', { now });

    expect(await ProcessedMessage.findById('azure:msg-2').lean()).toMatchObject({
      status: 'processed',
      processedAt: now,
    });
    expect(await repository.claim('azure:msg-2', {
      source: 'azure',
      sensorId: 'TEMP-01',
      now: new Date('2026-01-01T00:01:00.000Z'),
    })).toBe(false);
  });

  it('reclaims a message after its lease expires', async () => {
    const old = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date('2026-01-01T00:02:00.000Z');
    await ProcessedMessage.create({
      _id: 'azure:msg-3',
      source: 'azure',
      sensorId: 'TEMP-01',
      status: 'processing',
      claimedAt: old,
      leaseUntil: new Date('2026-01-01T00:01:00.000Z'),
      expiresAt: new Date('2026-01-08T00:00:00.000Z'),
    });

    expect(await repository.claim('azure:msg-3', {
      source: 'azure',
      sensorId: 'TEMP-01',
      now,
    })).toBe(true);

    const stored = await ProcessedMessage.findById('azure:msg-3').lean();
    expect(stored.claimedAt).toEqual(now);
    expect(stored.leaseUntil.getTime()).toBeGreaterThan(now.getTime());
  });

  it('releases a failed claim so it can be retried', async () => {
    await repository.claim('azure:msg-4', { source: 'azure', sensorId: 'TEMP-01' });
    await repository.release('azure:msg-4');

    expect(await ProcessedMessage.findById('azure:msg-4')).toBeNull();
    expect(await repository.claim('azure:msg-4', {
      source: 'azure',
      sensorId: 'TEMP-01',
    })).toBe(true);
  });

  it('expires processed messages through the TTL index', async () => {
    const indexes = await ProcessedMessage.collection.indexes();
    expect(indexes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: { expiresAt: 1 },
        expireAfterSeconds: 0,
      }),
    ]));
  });

  it('requires a deterministic message key', async () => {
    await expect(repository.claim('', { source: 'azure' }))
      .rejects.toThrow('messageKey is required');
  });
});
