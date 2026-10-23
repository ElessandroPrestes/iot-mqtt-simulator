const mongoose = require('mongoose');
const Alert = require('../../src/models/Alert');
const {
  INDEX_NAME,
  INDEX_OPTIONS,
  migrateAlertUniqueness,
} = require('../../scripts/migrate-alert-uniqueness');

async function dropUniqueIndex() {
  try {
    await Alert.collection.dropIndex(INDEX_NAME);
  } catch (err) {
    if (err.code !== 27 && err.codeName !== 'IndexNotFound') throw err;
  }
}

function alert(sensorId, level, timestamp, resolved = false) {
  return {
    _id: new mongoose.Types.ObjectId(),
    sensorId,
    type: 'temperature',
    level,
    value: 30,
    unit: '°C',
    message: 'test',
    resolved,
    timestamp,
  };
}

describe('migrateAlertUniqueness', () => {
  beforeAll(async () => {
    await Alert.init();
    await dropUniqueIndex();
  });

  beforeEach(dropUniqueIndex);

  afterAll(async () => {
    await Alert.collection.createIndex({ sensorId: 1, level: 1 }, INDEX_OPTIONS);
  });

  it('keeps the newest active alert and resolves duplicates idempotently', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const older = alert('TEMP-01', 'warning', new Date('2025-12-01T00:00:00.000Z'));
    const newest = alert('TEMP-01', 'warning', new Date('2025-12-03T00:00:00.000Z'));
    const middle = alert('TEMP-01', 'warning', new Date('2025-12-02T00:00:00.000Z'));
    const alreadyResolved = alert(
      'TEMP-01',
      'warning',
      new Date('2025-11-01T00:00:00.000Z'),
      true
    );

    await Alert.collection.insertMany([older, newest, middle, alreadyResolved]);

    const first = await migrateAlertUniqueness({ now });

    expect(first).toEqual({ duplicateGroups: 1, resolved: 2 });
    expect(await Alert.countDocuments({ sensorId: 'TEMP-01', level: 'warning', resolved: false }))
      .toBe(1);
    expect(await Alert.findById(newest._id).lean()).toMatchObject({ resolved: false });
    expect(await Alert.findById(older._id).lean()).toMatchObject({
      resolved: true,
      resolvedAt: now,
    });
    expect(await Alert.findById(middle._id).lean()).toMatchObject({
      resolved: true,
      resolvedAt: now,
    });
    expect(await Alert.findById(alreadyResolved._id).lean()).toMatchObject({
      resolved: true,
    });

    const second = await migrateAlertUniqueness({ now: new Date('2026-01-02T00:00:00.000Z') });
    expect(second).toEqual({ duplicateGroups: 0, resolved: 0 });

    await expect(Alert.collection.insertOne(
      alert('TEMP-01', 'warning', new Date())
    )).rejects.toMatchObject({ code: 11000 });
  });

  it('creates the unique index when there are no duplicates', async () => {
    await Alert.collection.insertMany([
      alert('TEMP-02', 'critical', new Date()),
      alert('PRES-01', 'warning', new Date()),
    ]);

    const result = await migrateAlertUniqueness();

    expect(result).toEqual({ duplicateGroups: 0, resolved: 0 });
    const indexes = await Alert.collection.indexes();
    expect(indexes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: INDEX_NAME,
        unique: true,
        partialFilterExpression: { resolved: false },
      }),
    ]));
  });
});
