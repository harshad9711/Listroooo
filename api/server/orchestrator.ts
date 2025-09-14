/**
 * Model Orchestrator
 * Handles intelligent model selection with fallbacks and latency awareness
 */

import { createClient } from '@supabase/supabase-js';
import { ResilientServiceCalls } from '../lib/resilientCall.js';
import { circuitBreakerManager } from '../lib/circuitBreaker.js';
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
  confidence: number;
}

export interface OrchestrationMetrics {
  modelName: string;
  latencyMs: number;
  success: boolean;
  fallbackUsed: boolean;
  costPreference: string;
  confidence: number;
}

// =========================
// MODEL CONFIGURATION
// =========================

const MODEL_CONFIG = {
  primary: {
    name: process.env.MODEL_PRIMARY || 'veo-3.0-generate-001',
    latencyMs: 30000,
    costMultiplier: 1.0,
    qualityScore: 0.9,
    reliability: 0.95
  },
  fast: {
    name: process.env.MODEL_FAST || 'veo-3.0-fast-generate-001',
    latencyMs: 15000,
    costMultiplier: 0.6,
    qualityScore: 0.7,
    reliability: 0.90
  }
};

// =========================
// ORCHESTRATION LOGIC
// =========================

export async function selectModel(
  constraints: OrchestrationConstraints,
  jobId: string,
  prompt: any
): Promise<ModelSelection> {
  try {
    logger.info({ constraints, jobId }, 'Starting model selection');

    // Get current system state
    const [queueMetrics, circuitBreakerStates, historicalData] = await Promise.all([
      getQueueMetrics(),
      circuitBreakerManager.getAllStats(),
      getHistoricalModelData(constraints.costPreference)
    ]);

    // Calculate model scores
    const primaryScore = calculateModelScore(
      MODEL_CONFIG.primary,
      constraints,
      queueMetrics,
      circuitBreakerStates,
      historicalData
    );

    const fastScore = calculateModelScore(
      MODEL_CONFIG.fast,
      constraints,
      queueMetrics,
      circuitBreakerStates,
      historicalData
    );

    // Select best model
    const selectedModel = primaryScore.totalScore >= fastScore.totalScore ? 
      { config: MODEL_CONFIG.primary, score: primaryScore } :
      { config: MODEL_CONFIG.fast, score: fastScore };

    const selection: ModelSelection = {
      modelName: selectedModel.config.name,
      reason: generateSelectionReason(selectedModel, constraints),
      estimatedLatency: selectedModel.score.estimatedLatency,
      fallbackUsed: selectedModel.config.name !== MODEL_CONFIG.primary.name,
      confidence: selectedModel.score.confidence
    };

    // Record selection for analytics
    await recordModelSelection(jobId, selection, constraints.costPreference, prompt);

    logger.info({ 
      jobId, 
      selectedModel: selection.modelName,
      confidence: selection.confidence,
      estimatedLatency: selection.estimatedLatency
    }, 'Model selected');

    return selection;

  } catch (error) {
    logger.error({ error: error.message, constraints, jobId }, 'Model selection failed');
    
    // Fallback to primary model
    return {
      modelName: MODEL_CONFIG.primary.name,
      reason: 'Selection failed, using primary model',
      estimatedLatency: MODEL_CONFIG.primary.latencyMs,
      fallbackUsed: false,
      confidence: 0.5
    };
  }
}

export async function executeWithModel<T>(
  modelName: string,
  operation: () => Promise<T>,
  jobId: string,
  constraints: OrchestrationConstraints
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
    
    // Try fallback if primary model failed
    if (modelName === MODEL_CONFIG.primary.name) {
      try {
        logger.info({ jobId }, 'Attempting fallback to fast model');
        const fallbackResult = await ResilientServiceCalls.callVeo(operation);
        success = true;
        fallbackUsed = true;
        return fallbackResult;
      } catch (fallbackError) {
        logger.error({ jobId, error: fallbackError.message }, 'Fallback model also failed');
      }
    }
    
    throw error;

  } finally {
    const latency = Date.now() - startTime;
    
    // Record metrics
    await recordModelMetrics({
      modelName,
      latencyMs: latency,
      success,
      fallbackUsed,
      costPreference: constraints.costPreference,
      confidence: success ? 0.9 : 0.1
    }, jobId);
  }
}

// =========================
// MODEL SCORING
// =========================

function calculateModelScore(
  model: any,
  constraints: OrchestrationConstraints,
  queueMetrics: any,
  circuitBreakerStates: any,
  historicalData: any
): {
  latencyScore: number;
  qualityScore: number;
  reliabilityScore: number;
  costScore: number;
  totalScore: number;
  estimatedLatency: number;
  confidence: number;
} {
  // Calculate estimated latency
  const baseLatency = model.latencyMs;
  const queueFactor = Math.min(queueMetrics.active || 0, 10) * 1000;
  const waitingFactor = Math.min(queueMetrics.waiting || 0, 20) * 500;
  const estimatedLatency = baseLatency + queueFactor + waitingFactor;

  // Check circuit breaker state
  const breakerState = circuitBreakerStates[model.name];
  const isAvailable = !breakerState || breakerState.state !== 'open';

  // Calculate scores (0-1)
  const latencyScore = Math.max(0, 1 - (estimatedLatency / constraints.maxLatencyMs));
  const qualityScore = model.qualityScore;
  const reliabilityScore = isAvailable ? model.reliability : 0;
  const costScore = calculateCostScore(model, constraints.costPreference);

  // Weighted total score
  const weights = getWeightsForPreference(constraints.costPreference);
  const totalScore = (
    latencyScore * weights.latency +
    qualityScore * weights.quality +
    reliabilityScore * weights.reliability +
    costScore * weights.cost
  );

  // Calculate confidence based on historical performance
  const confidence = calculateConfidence(model.name, historicalData, isAvailable);

  return {
    latencyScore,
    qualityScore,
    reliabilityScore,
    costScore,
    totalScore,
    estimatedLatency,
    confidence
  };
}

function calculateCostScore(model: any, preference: string): number {
  switch (preference) {
    case 'low':
      return 1 - model.costMultiplier;
    case 'quality':
      return model.qualityScore;
    case 'balanced':
    default:
      return 1 - (model.costMultiplier * 0.5) + (model.qualityScore * 0.5);
  }
}

function getWeightsForPreference(preference: string): {
  latency: number;
  quality: number;
  reliability: number;
  cost: number;
} {
  switch (preference) {
    case 'low':
      return { latency: 0.3, quality: 0.2, reliability: 0.3, cost: 0.2 };
    case 'quality':
      return { latency: 0.2, quality: 0.4, reliability: 0.3, cost: 0.1 };
    case 'balanced':
    default:
      return { latency: 0.3, quality: 0.3, reliability: 0.3, cost: 0.1 };
  }
}

function calculateConfidence(modelName: string, historicalData: any, isAvailable: boolean): number {
  if (!isAvailable) return 0.1;

  const modelData = historicalData[modelName];
  if (!modelData) return 0.7; // Default confidence for new models

  const successRate = modelData.successfulJobs / modelData.totalJobs;
  const avgLatency = modelData.totalLatency / modelData.totalJobs;
  const latencyConsistency = 1 - (modelData.latencyVariance / avgLatency);

  return Math.min(0.95, (successRate * 0.5 + latencyConsistency * 0.5));
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
// DATA COLLECTION
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

async function getHistoricalModelData(costPreference: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('model_metrics')
      .select('model_name, latency_ms, success, cost_preference')
      .eq('cost_preference', costPreference)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      logger.warn({ error: error.message }, 'Failed to get historical data');
      return {};
    }

    // Aggregate by model
    const aggregated = data?.reduce((acc: any, metric: any) => {
      const model = metric.model_name;
      if (!acc[model]) {
        acc[model] = {
          totalJobs: 0,
          successfulJobs: 0,
          totalLatency: 0,
          latencyVariance: 0
        };
      }

      acc[model].totalJobs++;
      if (metric.success) acc[model].successfulJobs++;
      acc[model].totalLatency += metric.latency_ms;

      return acc;
    }, {});

    // Calculate variance
    Object.values(aggregated || {}).forEach((model: any) => {
      if (model.totalJobs > 1) {
        const avgLatency = model.totalLatency / model.totalJobs;
        model.latencyVariance = Math.sqrt(
          data?.filter((m: any) => m.model_name === Object.keys(aggregated || {}).find(k => aggregated[k] === model))
            .reduce((sum: number, m: any) => sum + Math.pow(m.latency_ms - avgLatency, 2), 0) / model.totalJobs
        );
      }
    });

    return aggregated || {};

  } catch (error) {
    logger.warn({ error: error.message }, 'Failed to get historical data');
    return {};
  }
}

// =========================
// RECORDING & ANALYTICS
// =========================

async function recordModelSelection(
  jobId: string,
  selection: ModelSelection,
  costPreference: string,
  prompt: any
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
// SELECTION REASONING
// =========================

function generateSelectionReason(
  selected: { config: any; score: any },
  constraints: OrchestrationConstraints
): string {
  const reasons = [];

  if (selected.score.latencyScore > 0.8) {
    reasons.push('excellent latency performance');
  } else if (selected.score.latencyScore > 0.6) {
    reasons.push('good latency performance');
  }

  if (selected.score.qualityScore > 0.8) {
    reasons.push('high quality output');
  } else if (selected.score.qualityScore > 0.6) {
    reasons.push('good quality output');
  }

  if (selected.score.reliabilityScore > 0.9) {
    reasons.push('high reliability');
  } else if (selected.score.reliabilityScore > 0.7) {
    reasons.push('good reliability');
  }

  if (constraints.costPreference === 'low' && selected.score.costScore > 0.7) {
    reasons.push('cost-effective');
  }

  if (reasons.length === 0) {
    return 'Selected based on available options';
  }

  return `Selected for ${reasons.join(', ')}`;
}

