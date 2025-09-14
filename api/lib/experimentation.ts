import { createClient } from '@supabase/supabase-js';
import pino from 'pino';

const logger = pino({ name: 'experimentation' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface Campaign {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  budget_cents: number;
  target_platforms: string[];
  created_at: string;
  updated_at: string;
}

export interface Experiment {
  id: string;
  campaign_id: string;
  org_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  traffic_split: number; // 0.0 to 1.0
  control_prompt_snapshot_id?: string;
  variant_prompt_snapshot_id?: string;
  metrics: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ExperimentResult {
  id: string;
  experiment_id: string;
  veo_job_id: string;
  variant: 'control' | 'variant';
  metrics: Record<string, any>;
  created_at: string;
}

export interface PerformanceMetrics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagement_rate: number;
  completion_rate: number;
  click_through_rate: number;
  conversion_rate: number;
}

// =========================
// CAMPAIGN MANAGEMENT
// =========================

export async function createCampaign(
  orgId: string,
  name: string,
  description?: string,
  budgetCents = 0,
  targetPlatforms: string[] = []
): Promise<Campaign> {
  try {
    const { data, error } = await supabase
      .from('veo_campaigns')
      .insert({
        org_id: orgId,
        name,
        description,
        status: 'draft',
        budget_cents: budgetCents,
        target_platforms: targetPlatforms
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }

    logger.info({ campaignId: data.id, orgId }, 'Campaign created');
    return data;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create campaign');
    throw error;
  }
}

export async function getCampaigns(orgId: string, status?: string): Promise<Campaign[]> {
  try {
    let query = supabase
      .from('veo_campaigns')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get campaigns: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get campaigns');
    throw error;
  }
}

export async function updateCampaign(
  campaignId: string,
  updates: Partial<Campaign>
): Promise<Campaign> {
  try {
    const { data, error } = await supabase
      .from('veo_campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update campaign: ${error.message}`);
    }

    logger.info({ campaignId }, 'Campaign updated');
    return data;
  } catch (error) {
    logger.error({ campaignId, error: error.message }, 'Failed to update campaign');
    throw error;
  }
}

// =========================
// EXPERIMENT MANAGEMENT
// =========================

export async function createExperiment(
  campaignId: string,
  orgId: string,
  name: string,
  description?: string,
  trafficSplit = 0.5,
  controlPromptSnapshotId?: string,
  variantPromptSnapshotId?: string
): Promise<Experiment> {
  try {
    const { data, error } = await supabase
      .from('veo_experiments')
      .insert({
        campaign_id: campaignId,
        org_id: orgId,
        name,
        description,
        status: 'draft',
        traffic_split: trafficSplit,
        control_prompt_snapshot_id: controlPromptSnapshotId,
        variant_prompt_snapshot_id: variantPromptSnapshotId
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create experiment: ${error.message}`);
    }

    logger.info({ experimentId: data.id, campaignId }, 'Experiment created');
    return data;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create experiment');
    throw error;
  }
}

export async function getExperiments(orgId: string, campaignId?: string): Promise<Experiment[]> {
  try {
    let query = supabase
      .from('veo_experiments')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get experiments: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get experiments');
    throw error;
  }
}

export async function startExperiment(experimentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('veo_experiments')
      .update({
        status: 'running',
        updated_at: new Date().toISOString()
      })
      .eq('id', experimentId);

    if (error) {
      throw new Error(`Failed to start experiment: ${error.message}`);
    }

    logger.info({ experimentId }, 'Experiment started');
  } catch (error) {
    logger.error({ experimentId, error: error.message }, 'Failed to start experiment');
    throw error;
  }
}

export async function stopExperiment(experimentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('veo_experiments')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', experimentId);

    if (error) {
      throw new Error(`Failed to stop experiment: ${error.message}`);
    }

    logger.info({ experimentId }, 'Experiment stopped');
  } catch (error) {
    logger.error({ experimentId, error: error.message }, 'Failed to stop experiment');
    throw error;
  }
}

// =========================
// EXPERIMENT ASSIGNMENT
// =========================

export async function assignToExperiment(
  experimentId: string,
  userId: string
): Promise<'control' | 'variant'> {
  try {
    // Get experiment details
    const { data: experiment, error } = await supabase
      .from('veo_experiments')
      .select('*')
      .eq('id', experimentId)
      .single();

    if (error) {
      throw new Error(`Experiment not found: ${error.message}`);
    }

    if (experiment.status !== 'running') {
      throw new Error('Experiment is not running');
    }

    // Use consistent hashing to assign variant
    const hash = createHash('sha256')
      .update(`${experimentId}:${userId}`)
      .digest('hex');
    
    const hashValue = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
    const variant = hashValue < experiment.traffic_split ? 'variant' : 'control';

    logger.info({ experimentId, userId, variant }, 'User assigned to experiment variant');
    return variant;
  } catch (error) {
    logger.error({ experimentId, userId, error: error.message }, 'Failed to assign to experiment');
    throw error;
  }
}

// =========================
// EXPERIMENT RESULTS
// =========================

export async function recordExperimentResult(
  experimentId: string,
  veoJobId: string,
  variant: 'control' | 'variant',
  metrics: Record<string, any>
): Promise<ExperimentResult> {
  try {
    const { data, error } = await supabase
      .from('veo_experiment_results')
      .insert({
        experiment_id: experimentId,
        veo_job_id: veoJobId,
        variant,
        metrics
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record experiment result: ${error.message}`);
    }

    logger.info({ experimentId, veoJobId, variant }, 'Experiment result recorded');
    return data;
  } catch (error) {
    logger.error({ experimentId, veoJobId, error: error.message }, 'Failed to record experiment result');
    throw error;
  }
}

export async function getExperimentResults(experimentId: string): Promise<ExperimentResult[]> {
  try {
    const { data, error } = await supabase
      .from('veo_experiment_results')
      .select('*')
      .eq('experiment_id', experimentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get experiment results: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ experimentId, error: error.message }, 'Failed to get experiment results');
    throw error;
  }
}

// =========================
// PERFORMANCE TRACKING
// =========================

export async function trackPerformance(
  veoJobId: string,
  orgId: string,
  platform: string,
  externalPostId: string,
  metrics: PerformanceMetrics
): Promise<void> {
  try {
    const { error } = await supabase
      .from('veo_performance_metrics')
      .insert({
        veo_job_id: veoJobId,
        org_id: orgId,
        platform,
        external_post_id: externalPostId,
        metrics
      });

    if (error) {
      throw new Error(`Failed to track performance: ${error.message}`);
    }

    logger.info({ veoJobId, platform, externalPostId }, 'Performance metrics tracked');
  } catch (error) {
    logger.error({ veoJobId, error: error.message }, 'Failed to track performance');
    throw error;
  }
}

export async function getPerformanceMetrics(
  orgId: string,
  platform?: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  try {
    let query = supabase
      .from('veo_performance_metrics')
      .select('*')
      .eq('org_id', orgId)
      .order('collected_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (startDate) {
      query = query.gte('collected_at', startDate);
    }

    if (endDate) {
      query = query.lte('collected_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get performance metrics: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get performance metrics');
    throw error;
  }
}

// =========================
// EXPERIMENT ANALYTICS
// =========================

export async function getExperimentAnalytics(experimentId: string): Promise<{
  totalResults: number;
  controlResults: number;
  variantResults: number;
  controlMetrics: Record<string, number>;
  variantMetrics: Record<string, number>;
  statisticalSignificance: number;
  confidenceLevel: number;
}> {
  try {
    const results = await getExperimentResults(experimentId);
    
    const controlResults = results.filter(r => r.variant === 'control');
    const variantResults = results.filter(r => r.variant === 'variant');

    // Calculate metrics for each variant
    const controlMetrics = calculateMetrics(controlResults);
    const variantMetrics = calculateMetrics(variantResults);

    // Calculate statistical significance
    const statisticalSignificance = calculateStatisticalSignificance(
      controlResults,
      variantResults
    );

    return {
      totalResults: results.length,
      controlResults: controlResults.length,
      variantResults: variantResults.length,
      controlMetrics,
      variantMetrics,
      statisticalSignificance,
      confidenceLevel: statisticalSignificance > 0.95 ? 95 : statisticalSignificance > 0.90 ? 90 : 80
    };
  } catch (error) {
    logger.error({ experimentId, error: error.message }, 'Failed to get experiment analytics');
    throw error;
  }
}

// =========================
// HELPER FUNCTIONS
// =========================

function calculateMetrics(results: ExperimentResult[]): Record<string, number> {
  if (results.length === 0) {
    return {
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      engagement_rate: 0,
      completion_rate: 0,
      click_through_rate: 0,
      conversion_rate: 0
    };
  }

  const totals = results.reduce((acc, result) => {
    const metrics = result.metrics as PerformanceMetrics;
    acc.views += metrics.views || 0;
    acc.likes += metrics.likes || 0;
    acc.shares += metrics.shares || 0;
    acc.comments += metrics.comments || 0;
    acc.engagement_rate += metrics.engagement_rate || 0;
    acc.completion_rate += metrics.completion_rate || 0;
    acc.click_through_rate += metrics.click_through_rate || 0;
    acc.conversion_rate += metrics.conversion_rate || 0;
    return acc;
  }, {
    views: 0,
    likes: 0,
    shares: 0,
    comments: 0,
    engagement_rate: 0,
    completion_rate: 0,
    click_through_rate: 0,
    conversion_rate: 0
  });

  // Calculate averages
  const count = results.length;
  return {
    views: totals.views,
    likes: totals.likes,
    shares: totals.shares,
    comments: totals.comments,
    engagement_rate: totals.engagement_rate / count,
    completion_rate: totals.completion_rate / count,
    click_through_rate: totals.click_through_rate / count,
    conversion_rate: totals.conversion_rate / count
  };
}

function calculateStatisticalSignificance(
  controlResults: ExperimentResult[],
  variantResults: ExperimentResult[]
): number {
  // Simplified statistical significance calculation
  // In production, you would use proper statistical tests (t-test, chi-square, etc.)
  
  if (controlResults.length < 30 || variantResults.length < 30) {
    return 0.5; // Not enough data for significance
  }

  const controlMetrics = calculateMetrics(controlResults);
  const variantMetrics = calculateMetrics(variantResults);

  // Calculate improvement percentage
  const improvement = (variantMetrics.engagement_rate - controlMetrics.engagement_rate) / controlMetrics.engagement_rate;
  
  // Simple significance calculation based on improvement and sample size
  const sampleSize = Math.min(controlResults.length, variantResults.length);
  const significance = Math.min(0.99, 0.5 + (improvement * 0.3) + (sampleSize / 1000) * 0.2);
  
  return significance;
}

// =========================
// EXPORTS
// =========================

export { Campaign, Experiment, ExperimentResult, PerformanceMetrics };

