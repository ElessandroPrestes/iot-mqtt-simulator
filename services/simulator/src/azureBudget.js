const BYTES_PER_BILLABLE_BLOCK = 512;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function estimateDailyMessages({ sensorsCount, intervalMs, payloadBytes }) {
  if (!Number.isInteger(sensorsCount) || sensorsCount < 1) {
    throw new Error('sensorsCount must be a positive integer');
  }
  if (!Number.isInteger(intervalMs) || intervalMs < 1) {
    throw new Error('intervalMs must be a positive integer');
  }

  const bytes = Number(payloadBytes);
  if (!Number.isFinite(bytes) || bytes < 1) {
    throw new Error('payloadBytes must be a positive number');
  }

  const blocks = Math.ceil(bytes / BYTES_PER_BILLABLE_BLOCK);
  const messagesPerSensor = Math.ceil(MS_PER_DAY / intervalMs);

  return sensorsCount * messagesPerSensor * blocks;
}

export function assertAzureBudget({
  sensorsCount,
  intervalMs,
  payloadBytes,
  dailyMessageBudget,
  allowOverage = false,
}) {
  const dailyMessages = estimateDailyMessages({
    sensorsCount,
    intervalMs,
    payloadBytes,
  });

  if (dailyMessages > dailyMessageBudget && !allowOverage) {
    throw new Error(
      `Azure daily message budget exceeded: estimated ${dailyMessages} > ${dailyMessageBudget}. ` +
        'Increase SIMULATOR_INTERVAL_MS, reduce SIMULATOR_SENSORS_COUNT, ' +
        'raise AZURE_DAILY_MESSAGE_BUDGET, or set AZURE_ALLOW_OVERAGE=true.'
    );
  }

  return {
    dailyMessages,
    dailyMessageBudget,
    allowOverage,
    blocksPerMessage: Math.ceil(payloadBytes / BYTES_PER_BILLABLE_BLOCK),
  };
}
