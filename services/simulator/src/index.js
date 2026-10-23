import { config } from './config.js';
import { assertAzureBudget } from './azureBudget.js';
import { createPublisher } from './publishers/createPublisher.js';
import { buildSensors } from './sensors/factory.js';
import { Simulator } from './simulator.js';
import { logger } from './logger.js';

function estimatePayloadBytes(sensors) {
  return Math.max(
    ...sensors.map(({ sensor }) =>
      Buffer.byteLength(JSON.stringify(sensor.read()), 'utf8')
    )
  );
}

async function main() {
  const sensors = buildSensors(
    config.simulator.sensorsCount,
    config.simulator.anomalyProbability
  );
  const publisher = createPublisher(config, logger);
  let simulator = null;
  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(`Received ${signal}. Shutting down...`);
    simulator?.stop();
    await publisher.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    if (config.transport === 'azure') {
      const budget = assertAzureBudget({
        sensorsCount: sensors.length,
        intervalMs: config.simulator.intervalMs,
        payloadBytes: estimatePayloadBytes(sensors),
        dailyMessageBudget: config.azure.dailyMessageBudget,
        allowOverage: config.azure.allowOverage,
      });
      logger.info('Azure message budget check', budget);
    }

    await publisher.start();

    simulator = new Simulator({
      sensors,
      publisher,
      intervalMs: config.simulator.intervalMs,
      logger,
    });
    simulator.start();

    logger.info('Simulator started', {
      transport: config.transport,
      sensors: sensors.length,
      intervalMs: config.simulator.intervalMs,
    });
  } catch (err) {
    logger.error('Simulator startup failed', { error: err.message });
    simulator?.stop();
    await publisher.stop();
    process.exit(1);
  }
}

main();
