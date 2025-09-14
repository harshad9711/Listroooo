/**
 * Monitoring & Health Check Service
 * Handles synthetic monitoring and health checks
 */

import { createClient } from '@supabase/supabase-js';
import { getQueueHealth } from './queueHardening.js';
import { circuitBreakerManager } from './circuitBreaker.js';
import pino from 'pino';

const logger = pino({ name: 'monitoring' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    queues: ServiceHealth;
    circuitBreakers: ServiceHealth;
  };
  metrics: {
    activeJobs: number;
    waitingJobs: number;
    failedJobs: number;
    dlqJobs: number;
    openBreakers: number;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
}

export interface MonitoringPing {
  endpoint: string;
  responseTime: number;
  statusCode: number;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}

// =========================
// HEALTH CHECKS
// =========================

export async function performHealthCheck(): Promise<HealthCheck> {
  try {
    const startTime = Date.now();
    
    // Check all services
    const [databaseHealth, redisHealth, queuesHealth, breakersHealth] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkQueuesHealth(),
      checkCircuitBreakersHealth()
    ]);

    const services = {
      database: databaseHealth.status === 'fulfilled' ? databaseHealth.value : { status: 'down' as const, error: 'Database check failed' },
      redis: redisHealth.status === 'fulfilled' ? redisHealth.value : { status: 'down' as const, error: 'Redis check failed' },
      queues: queuesHealth.status === 'fulfilled' ? queuesHealth.value : { status: 'down' as const, error: 'Queues check failed' },
      circuitBreakers: breakersHealth.status === 'fulfilled' ? breakersHealth.value : { status: 'down' as const, error: 'Circuit breakers check failed' }
    };

    // Get queue metrics
    const queueHealth = await getQueueHealth();
    const metrics = {
      activeJobs: queueHealth.overall.totalActive,
      waitingJobs: queueHealth.overall.totalWaiting,
      failedJobs: queueHealth.overall.totalFailed,
      dlqJobs: queueHealth.overall.totalDlq,
      openBreakers: Object.values(services.circuitBreakers).filter(s => s.status === 'down').length
    };

    // Determine overall status
    const allUp = Object.values(services).every(s => s.status === 'up');
    const anyDown = Object.values(services).some(s => s.status === 'down');
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allUp) {
      status = 'healthy';
    } else if (anyDown) {
      status = 'unhealthy';
    } else {
      status = 'degraded';
    }

    const healthCheck: HealthCheck = {
      status,
      timestamp: new Date().toISOString(),
      services,
      metrics
    };

    // Record health check
    await recordHealthCheck(healthCheck);

    return healthCheck;

  } catch (error) {
    logger.error({ error: error.message }, 'Health check failed');
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: 'down', error: 'Health check failed' },
        redis: { status: 'down', error: 'Health check failed' },
        queues: { status: 'down', error: 'Health check failed' },
        circuitBreakers: { status: 'down', error: 'Health check failed' }
      },
      metrics: {
        activeJobs: 0,
        waitingJobs: 0,
        failedJobs: 0,
        dlqJobs: 0,
        openBreakers: 0
      }
    };
  }
}

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const { error } = await supabase
      .from('veo_jobs')
      .select('id')
      .limit(1);

    if (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }

    return {
      status: 'up',
      responseTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

async function checkRedisHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const redis = (await import('ioredis')).default;
    const client = new redis(process.env.REDIS_URL!);
    
    await client.ping();
    await client.disconnect();

    return {
      status: 'up',
      responseTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

async function checkQueuesHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const queueHealth = await getQueueHealth();
    
    // Check if queues are overloaded
    const totalJobs = queueHealth.overall.totalActive + queueHealth.overall.totalWaiting;
    const isOverloaded = totalJobs > 100; // Threshold for overloaded

    return {
      status: isOverloaded ? 'degraded' : 'up',
      responseTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

async function checkCircuitBreakersHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const breakerStats = circuitBreakerManager.getAllStats();
    const openBreakers = Object.values(breakerStats).filter(stat => stat.state === 'open');
    
    const status = openBreakers.length === 0 ? 'up' : 
                  openBreakers.length < Object.keys(breakerStats).length / 2 ? 'degraded' : 'down';

    return {
      status,
      responseTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

// =========================
// MONITORING PINGS
// =========================

export async function recordMonitoringPing(ping: MonitoringPing): Promise<void> {
  try {
    await supabase
      .from('monitoring_pings')
      .insert({
        endpoint: ping.endpoint,
        response_time: ping.responseTime,
        status_code: ping.statusCode,
        success: ping.success,
        error_message: ping.errorMessage,
        metadata: ping.metadata
      });

  } catch (error) {
    logger.error({ error: error.message, ping }, 'Failed to record monitoring ping');
  }
}

export async function sendExternalPing(): Promise<void> {
  try {
    const pingUrl = process.env.MONITOR_PING_URL;
    if (!pingUrl) {
      logger.warn('No monitoring ping URL configured');
      return;
    }

    const startTime = Date.now();
    
    const response = await fetch(pingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'veo3-api',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      })
    });

    const responseTime = Date.now() - startTime;
    const success = response.ok;

    await recordMonitoringPing({
      endpoint: pingUrl,
      responseTime,
      statusCode: response.status,
      success,
      errorMessage: success ? undefined : `HTTP ${response.status}`,
      metadata: {
        service: 'veo3-api',
        version: process.env.npm_package_version || '1.0.0'
      }
    });

    logger.info({ 
      pingUrl, 
      responseTime, 
      statusCode: response.status, 
      success 
    }, 'External ping sent');

  } catch (error) {
    logger.error({ error: error.message }, 'External ping failed');
    
    await recordMonitoringPing({
      endpoint: process.env.MONITOR_PING_URL || 'unknown',
      responseTime: 0,
      statusCode: 0,
      success: false,
      errorMessage: error.message
    });
  }
}

// =========================
// DATABASE OPERATIONS
// =========================

async function recordHealthCheck(healthCheck: HealthCheck): Promise<void> {
  try {
    await supabase
      .from('monitoring_pings')
      .insert({
        endpoint: 'internal/health',
        response_time: 0,
        status_code: healthCheck.status === 'healthy' ? 200 : 500,
        success: healthCheck.status === 'healthy',
        metadata: {
          status: healthCheck.status,
          services: healthCheck.services,
          metrics: healthCheck.metrics
        }
      });

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to record health check');
  }
}

// =========================
// ANALYTICS
// =========================

export async function getMonitoringAnalytics(
  startDate?: string,
  endDate?: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    let query = supabase
      .from('monitoring_pings')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ error: error.message }, 'Failed to get monitoring analytics');
      return {
        success: false,
        error: 'Failed to get monitoring analytics'
      };
    }

    // Calculate analytics
    const totalPings = data?.length || 0;
    const successfulPings = data?.filter(p => p.success).length || 0;
    const successRate = totalPings > 0 ? (successfulPings / totalPings) * 100 : 0;
    const avgResponseTime = data?.length > 0 ? 
      data.reduce((sum, p) => sum + p.response_time, 0) / data.length : 0;

    // Group by endpoint
    const byEndpoint = data?.reduce((acc: any, ping: any) => {
      const endpoint = ping.endpoint;
      if (!acc[endpoint]) {
        acc[endpoint] = {
          endpoint,
          totalPings: 0,
          successfulPings: 0,
          avgResponseTime: 0,
          lastPing: null
        };
      }

      acc[endpoint].totalPings++;
      if (ping.success) acc[endpoint].successfulPings++;
      acc[endpoint].avgResponseTime += ping.response_time;
      acc[endpoint].lastPing = ping.created_at;

      return acc;
    }, {});

    // Calculate averages for each endpoint
    Object.values(byEndpoint || {}).forEach((endpoint: any) => {
      endpoint.avgResponseTime = endpoint.totalPings > 0 ? 
        endpoint.avgResponseTime / endpoint.totalPings : 0;
      endpoint.successRate = endpoint.totalPings > 0 ? 
        (endpoint.successfulPings / endpoint.totalPings) * 100 : 0;
    });

    return {
      success: true,
      data: {
        totalPings,
        successfulPings,
        successRate,
        avgResponseTime,
        byEndpoint: Object.values(byEndpoint || {})
      }
    };

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get monitoring analytics');
    return {
      success: false,
      error: 'Failed to get monitoring analytics'
    };
  }
}

