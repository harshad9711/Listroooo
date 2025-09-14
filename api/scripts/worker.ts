#!/usr/bin/env node

import pino from 'pino';
import { startVeoStartWorker } from '../workers/veoStartWorker';
import { startVeoPollWorker } from '../workers/veoPollWorker';
import { startVeoPostWorker } from '../workers/veoPostWorker';

const logger = pino({ name: 'worker-manager' });

// =========================
// WORKER MANAGEMENT
// =========================

class WorkerManager {
  private workers: any[] = [];
  private isShuttingDown = false;

  async start() {
    logger.info('Starting Veo 3 workers...');

    try {
      // Start all workers
      const startWorker = await startVeoStartWorker();
      const pollWorker = await startVeoPollWorker();
      const postWorker = await startVeoPostWorker();

      this.workers = [startWorker, pollWorker, postWorker];

      logger.info('All workers started successfully');

      // Set up graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error({ error: error.message }, 'Failed to start workers');
      process.exit(1);
    }
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        logger.warn('Shutdown already in progress');
        return;
      }

      this.isShuttingDown = true;
      logger.info({ signal }, 'Received shutdown signal, closing workers...');

      try {
        // Close all workers
        await Promise.all(this.workers.map(worker => worker.close()));
        logger.info('All workers closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error({ error: error.message }, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// =========================
// MAIN EXECUTION
// =========================

async function main() {
  const workerManager = new WorkerManager();
  await workerManager.start();
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ error: error.message, stack: error.stack }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});

// Start the worker manager
main().catch((error) => {
  logger.error({ error: error.message }, 'Failed to start worker manager');
  process.exit(1);
});

