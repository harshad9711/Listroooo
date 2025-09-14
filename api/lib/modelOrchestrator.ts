/**
 * Model Orchestration Service
 * Handles model selection with fallbacks and latency awareness
 */

import { createClient } from '@supabase/supabase-js';
import { ResilientServiceCalls } from './resilientCall.js';
import { circuitBreakerManager } from './circuitBreaker.js';
import pino from 'pino';

const logger = pino({ name: 'model-orchestrator' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface OrchestrationConstraints {
  maxLatencyMs: number;
  costPreference: 'low' | 'balanced' | 'quality';
  qualityMode?: 'fast' | 'balanced' | 'high';
}

export interface ModelSelection {
  modelName: string;
  reason: string;
  estimatedLatency: number;
  fallbackUsed: boolean;
}

export interface OrchestrationMetrics {
  modelName: string;
  latencyMs: number;
  success: boolean;
  fallbackUsed: boolean;
  costPreference: string;
}

// =========================
// MODEL CONFIGURATION
// =========================

const MODEL_CONFIG = {
  primary: {
    name: process.env.MODEL_PRIMARY || 'veo-3.0-generate-001',
    latencyMs: 30000,
    costMultiplier: 1.0,
    qualityScore: 0.9
  },
  fast: {
    name: process.env.MODEL_FAST || 'veo-3.0-fast-generate-001',
    latencyMs: 15000,
    costMultiplier: 0.6,
    qualityScore: 0.7
  }
};

// =========================
// ORCHESTRATION LOGIC
// =========================

export async function selectModel(
  constraints: OrchestrationConstraints,
  jobId: string
): Promise<ModelSelection> {
  try {
    logger.info({ constraints, jobId }, 'Starting model selection');

    // Get current queue metrics
    const queueMetrics = await getQueueMetrics();
    const circuitBreakerStates = circuitBreakerManager.getAllStats();

    // Check primary model availability
    const primaryAvailable = isModelAvailable(MODEL_CONFIG.primary.name, circuitBreakerStates);
    const primaryLatency = estimateModelLatency(MODEL_CONFIG.primary, queueMetrics);

    // Check if primary model meets constraints
    if (primaryAvailable && primaryLatency <= constraints.maxLatencyMs) {
      const selection: ModelSelection = {
        modelName: MODEL_CONFIG.primary.name,
        reason: 'Primary model meets latency constraints',
        estimatedLatency: primaryLatency,
        fallbackUsed: false
      };

      await recordModelSelection(jobId, selection, constraints.costPreference);
      return selection;
    }

    // Check fast model as fallback
    const fastAvailable = isModelAvailable(MODEL_CONFIG.fast.name, circuitBreakerStates);
    const fastLatency = estimateModelLatency(MODEL_CONFIG.fast, queueMetrics);

    if (fastAvailable && fastLatency <= constraints.maxLatencyMs) {
      const selection: ModelSelection = {
        modelName: MODEL_CONFIG.fast.name,
        reason: 'Primary model unavailable or too slow, using fast model',
        estimatedLatency: fastLatency,
        fallbackUsed: true
      };

      await recordModelSelection(jobId, selection, constraints.costPreference);
      return selection;
    }

    // If no model meets constraints, use primary anyway
    const selection: ModelSelection = {
      modelName: MODEL_CONFIG.primary.name,
      reason: 'No model meets constraints, using primary with degraded performance',
      estimatedLatency: primaryLatency,
      fallbackUsed: false
    };

    await recordModelSelection(jobId, selection, constraints.costPreference);
    return selection;

  } catch (error) {
    logger.error({ error: error.message, constraints, jobId }, 'Model selection failed');
    
    // Fallback to primary model
    return {
      modelName: MODEL_CONFIG.primary.name,
      reason: 'Selection failed, using primary model',
      estimatedLatency: MODEL_CONFIG.primary.latencyMs,
      fallbackUsed: false
    };
  }
}

export async function executeWithModel<T>(
  modelName: string,
  operation: () => Promise<T>,
  jobId: string
): Promise<T> {
  const startTime = Date.now();
  let success = false;
  let fallbackUsed = false;

  try {
    logger.info({ modelName, jobId }, 'Executing operation with model');

    // Execute with appropriate circuit breaker
    const result = await ResilientServiceCalls.callVeo(operation);
    success = true;

    return result;

  } catch (error) {
    logger.error({ modelName, jobId, error: error.message }, 'Model execution failed');
    throw error;

  } finally {
    const latency = Date.now() - startTime;
    
    // Record metrics
    await recordModelMetrics({
      modelName,
      latencyMs: latency,
      success,
      fallbackUsed,
      costPreference: 'balanced' // This would come from the job context
    }, jobId);
  }
}

// =========================
// QUALITY MODE MAPPING
// =========================

export function mapQualityModeToConstraints(qualityMode: string): OrchestrationConstraints {
  switch (qualityMode) {
    case 'fast':
      return {
        maxLatencyMs: 20000,
        costPreference: 'low',
        qualityMode: 'fast'
      };
    
    case 'high':
      return {
        maxLatencyMs: 60000,
        costPreference: 'quality',
        qualityMode: 'high'
      };
    
    case 'balanced':
    default:
      return {
        maxLatencyMs: parseInt(process.env.MODEL_MAX_LATENCY_MS || '45000'),
        costPreference: 'balanced',
        qualityMode: 'balanced'
      };
  }
}

// =========================
// METRICS & MONITORING
// =========================

async function getQueueMetrics(): Promise<any> {
  try {
    const { data, error } = await supabase
      .rpc('get_queue_health');

    if (error) {
      logger.warn({ error: error.message }, 'Failed to get queue metrics');
      return { active: 0, waiting: 0 };
    }

    return data;
  } catch (error) {
    logger.warn({ error: error.message }, 'Failed to get queue metrics');
    return { active: 0, waiting: 0 };
  }
}

function isModelAvailable(modelName: string, circuitBreakerStates: any): boolean {
  const breakerState = circuitBreakerStates[modelName];
  return !breakerState || breakerState.state !== 'open';
}

function estimateModelLatency(modelConfig: any, queueMetrics: any): number {
  const baseLatency = modelConfig.latencyMs;
  const queueFactor = Math.min(queueMetrics.active || 0, 10) * 1000; // 1s per active job
  const waitingFactor = Math.min(queueMetrics.waiting || 0, 20) * 500; // 0.5s per waiting job
  
  return baseLatency + queueFactor + waitingFactor;
}

async function recordModelSelection(
  jobId: string,
  selection: ModelSelection,
  costPreference: string
): Promise<void> {
  try {
    await supabase
      .from('veo_jobs')
      .update({
        model_used: selection.modelName,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    await supabase
      .from('model_metrics')
      .insert({
        model_name: selection.modelName,
        job_id: jobId,
        latency_ms: selection.estimatedLatency,
        success: true,
        fallback_used: selection.fallbackUsed,
        cost_preference: costPreference
      });

  } catch (error) {
    logger.warn({ error: error.message, jobId }, 'Failed to record model selection');
  }
}

async function recordModelMetrics(
  metrics: OrchestrationMetrics,
  jobId: string
): Promise<void> {
  try {
    await supabase
      .from('model_metrics')
      .insert({
        model_name: metrics.modelName,
        job_id: jobId,
        latency_ms: metrics.latencyMs,
        success: metrics.success,
        fallback_used: metrics.fallbackUsed,
        cost_preference: metrics.costPreference
      });

  } catch (error) {
    logger.warn({ error: error.message, jobId }, 'Failed to record model metrics');
  }
}

// =========================
// ANALYTICS
// =========================

export async function getModelAnalytics(
  orgId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    let query = supabase
      .from('model_metrics')
      .select(`
        model_name,
        latency_ms,
        success,
        fallback_used,
        cost_preference,
        created_at,
        veo_jobs!inner(org_id)
      `)
      .eq('veo_jobs.org_id', orgId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ error: error.message }, 'Failed to get model analytics');
      return {
        success: false,
        error: 'Failed to get model analytics'
      };
    }

    // Aggregate metrics by model
    const analytics = data?.reduce((acc: any, metric: any) => {
      const model = metric.model_name;
      if (!acc[model]) {
        acc[model] = {
          modelName: model,
          totalJobs: 0,
          successfulJobs: 0,
          failedJobs: 0,
          fallbackJobs: 0,
          avgLatency: 0,
          totalLatency: 0,
          costPreference: metric.cost_preference
        };
      }

      acc[model].totalJobs++;
      acc[model].totalLatency += metric.latency_ms;
      acc[model].avgLatency = acc[model].totalLatency / acc[model].totalJobs;

      if (metric.success) {
        acc[model].successfulJobs++;
      } else {
        acc[model].failedJobs++;
      }

      if (metric.fallback_used) {
        acc[model].fallbackJobs++;
      }

      return acc;
    }, {});

    return {
      success: true,
      data: Object.values(analytics || {})
    };

  } catch (error) {
    logger.error({ error: error.message, orgId }, 'Failed to get model analytics');
    return {
      success: false,
      error: 'Failed to get model analytics'
    };
  }
}

