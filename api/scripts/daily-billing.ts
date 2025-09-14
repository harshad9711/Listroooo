#!/usr/bin/env node

import pino from 'pino';
import { processDailyBilling } from '../lib/billing';

const logger = pino({ name: 'daily-billing' });

async function main() {
  try {
    logger.info('Starting daily billing process');
    await processDailyBilling();
    logger.info('Daily billing process completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error: error.message }, 'Daily billing process failed');
    process.exit(1);
  }
}

main();

