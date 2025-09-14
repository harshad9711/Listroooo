#!/usr/bin/env node

import axios from 'axios';
import pino from 'pino';

const logger = pino({ name: 'health-check' });

async function checkHealth() {
  try {
    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Check API health
    const apiResponse = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    if (apiResponse.status !== 200) {
      throw new Error(`API health check failed: ${apiResponse.status}`);
    }

    // Check internal health
    const internalResponse = await axios.get(`${baseUrl}/internal/healthz`, { timeout: 5000 });
    if (internalResponse.status !== 200) {
      throw new Error(`Internal health check failed: ${internalResponse.status}`);
    }

    logger.info('Health check passed');
    console.log('✅ All health checks passed');
    process.exit(0);
  } catch (error) {
    logger.error({ error: error.message }, 'Health check failed');
    console.log('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

checkHealth();

