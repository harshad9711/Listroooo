import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import pino from 'pino';

const logger = pino({ name: 'prompt-versioning' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface PromptSnapshot {
  id: string;
  veo_job_id?: string;
  org_id: string;
  user_id: string;
  json_prompt: Record<string, any>;
  prompt_string: string;
  config: Record<string, any>;
  asset_hashes: Record<string, string>;
  seed?: number;
  created_at: string;
}

export interface PromptVersionRequest {
  veoJobId?: string;
  orgId: string;
  userId: string;
  jsonPrompt: Record<string, any>;
  promptString: string;
  config: Record<string, any>;
  assets?: Record<string, Buffer>;
  seed?: number;
}

export interface ReproduceRequest {
  snapshotId: string;
  orgId: string;
  userId: string;
  variations?: Record<string, any>;
}

// =========================
// PROMPT SNAPSHOT MANAGEMENT
// =========================

export async function createPromptSnapshot(request: PromptVersionRequest): Promise<PromptSnapshot> {
  try {
    const { veoJobId, orgId, userId, jsonPrompt, promptString, config, assets = {}, seed } = request;

    logger.info({ veoJobId, orgId, userId }, 'Creating prompt snapshot');

    // Generate asset hashes
    const assetHashes: Record<string, string> = {};
    for (const [key, asset] of Object.entries(assets)) {
      assetHashes[key] = createHash('sha256').update(asset).digest('hex');
    }

    // Generate prompt hash for deduplication
    const promptHash = createHash('sha256')
      .update(JSON.stringify({ jsonPrompt, promptString, config, assetHashes }))
      .digest('hex');

    // Check if snapshot already exists
    const { data: existingSnapshot } = await supabase
      .from('veo_prompt_snapshots')
      .select('id')
      .eq('org_id', orgId)
      .eq('prompt_hash', promptHash)
      .single();

    if (existingSnapshot) {
      logger.info({ snapshotId: existingSnapshot.id }, 'Prompt snapshot already exists');
      return await getPromptSnapshot(existingSnapshot.id);
    }

    // Create new snapshot
    const { data, error } = await supabase
      .from('veo_prompt_snapshots')
      .insert({
        veo_job_id: veoJobId,
        org_id: orgId,
        user_id: userId,
        json_prompt: jsonPrompt,
        prompt_string: promptString,
        config: config,
        asset_hashes: assetHashes,
        seed: seed,
        prompt_hash: promptHash
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create prompt snapshot: ${error.message}`);
    }

    logger.info({ snapshotId: data.id }, 'Prompt snapshot created');
    return data;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create prompt snapshot');
    throw error;
  }
}

export async function getPromptSnapshot(snapshotId: string): Promise<PromptSnapshot> {
  try {
    const { data, error } = await supabase
      .from('veo_prompt_snapshots')
      .select('*')
      .eq('id', snapshotId)
      .single();

    if (error) {
      throw new Error(`Prompt snapshot not found: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error({ snapshotId, error: error.message }, 'Failed to get prompt snapshot');
    throw error;
  }
}

export async function getPromptSnapshots(orgId: string, limit = 50): Promise<PromptSnapshot[]> {
  try {
    const { data, error } = await supabase
      .from('veo_prompt_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get prompt snapshots: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get prompt snapshots');
    throw error;
  }
}

export async function searchPromptSnapshots(
  orgId: string,
  query: string,
  filters?: Record<string, any>
): Promise<PromptSnapshot[]> {
  try {
    let dbQuery = supabase
      .from('veo_prompt_snapshots')
      .select('*')
      .eq('org_id', orgId);

    // Text search in prompt string
    if (query) {
      dbQuery = dbQuery.ilike('prompt_string', `%${query}%`);
    }

    // Apply filters
    if (filters) {
      if (filters.userId) {
        dbQuery = dbQuery.eq('user_id', filters.userId);
      }
      if (filters.dateFrom) {
        dbQuery = dbQuery.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        dbQuery = dbQuery.lte('created_at', filters.dateTo);
      }
      if (filters.hasSeed) {
        dbQuery = dbQuery.not('seed', 'is', null);
      }
    }

    const { data, error } = await dbQuery
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`Failed to search prompt snapshots: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ orgId, query, error: error.message }, 'Failed to search prompt snapshots');
    throw error;
  }
}

// =========================
// REPRODUCIBILITY
// =========================

export async function reproducePrompt(request: ReproduceRequest): Promise<string> {
  try {
    const { snapshotId, orgId, userId, variations = {} } = request;

    logger.info({ snapshotId, orgId, userId }, 'Reproducing prompt');

    // Get the original snapshot
    const snapshot = await getPromptSnapshot(snapshotId);

    // Apply variations to the prompt
    const reproducedPrompt = applyVariations(snapshot.json_prompt, variations);
    const reproducedConfig = applyVariations(snapshot.config, variations);

    // Create new job with reproduced prompt
    const { data: newJob, error } = await supabase
      .from('veo_jobs')
      .insert({
        org_id: orgId,
        user_id: userId,
        prompt: reproducedPrompt,
        config: reproducedConfig,
        status: 'pending',
        seed: snapshot.seed,
        metadata: {
          reproduced_from: snapshotId,
          variations: variations,
          original_snapshot: {
            id: snapshot.id,
            created_at: snapshot.created_at
          }
        }
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create reproduced job: ${error.message}`);
    }

    // Queue the job
    const { veoStartQ } = await import('../queues/veo.js');
    await veoStartQ.add('start', {
      jobId: newJob.id,
      organizationId: orgId,
      userId: userId,
      prompt: reproducedPrompt,
      config: reproducedConfig,
      priority: 0
    });

    logger.info({ snapshotId, newJobId: newJob.id }, 'Prompt reproduced successfully');
    return newJob.id;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to reproduce prompt');
    throw error;
  }
}

// =========================
// VERSION COMPARISON
// =========================

export async function comparePromptVersions(snapshotId1: string, snapshotId2: string): Promise<{
  differences: Record<string, any>;
  similarity: number;
}> {
  try {
    const [snapshot1, snapshot2] = await Promise.all([
      getPromptSnapshot(snapshotId1),
      getPromptSnapshot(snapshotId2)
    ]);

    const differences: Record<string, any> = {};
    let similarity = 1.0;

    // Compare JSON prompts
    const promptDiff = compareObjects(snapshot1.json_prompt, snapshot2.json_prompt);
    if (Object.keys(promptDiff).length > 0) {
      differences.json_prompt = promptDiff;
      similarity -= 0.3;
    }

    // Compare configs
    const configDiff = compareObjects(snapshot1.config, snapshot2.config);
    if (Object.keys(configDiff).length > 0) {
      differences.config = configDiff;
      similarity -= 0.2;
    }

    // Compare prompt strings
    if (snapshot1.prompt_string !== snapshot2.prompt_string) {
      differences.prompt_string = {
        original: snapshot1.prompt_string,
        modified: snapshot2.prompt_string
      };
      similarity -= 0.4;
    }

    // Compare asset hashes
    const assetDiff = compareObjects(snapshot1.asset_hashes, snapshot2.asset_hashes);
    if (Object.keys(assetDiff).length > 0) {
      differences.asset_hashes = assetDiff;
      similarity -= 0.1;
    }

    return {
      differences,
      similarity: Math.max(0, similarity)
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to compare prompt versions');
    throw error;
  }
}

// =========================
// PROMPT TEMPLATES
// =========================

export async function createPromptTemplate(
  orgId: string,
  userId: string,
  name: string,
  description: string,
  snapshotId: string,
  tags: string[] = []
): Promise<string> {
  try {
    const snapshot = await getPromptSnapshot(snapshotId);

    const { data, error } = await supabase
      .from('veo_templates')
      .insert({
        org_id: orgId,
        user_id: userId,
        name,
        description,
        type: 'prompt',
        data: {
          snapshot_id: snapshotId,
          json_prompt: snapshot.json_prompt,
          config: snapshot.config,
          tags: tags
        }
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create prompt template: ${error.message}`);
    }

    logger.info({ templateId: data.id, snapshotId }, 'Prompt template created');
    return data.id;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create prompt template');
    throw error;
  }
}

export async function getPromptTemplates(orgId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('veo_templates')
      .select('*')
      .eq('org_id', orgId)
      .eq('type', 'prompt')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get prompt templates: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get prompt templates');
    throw error;
  }
}

// =========================
// HELPER FUNCTIONS
// =========================

function applyVariations(original: Record<string, any>, variations: Record<string, any>): Record<string, any> {
  const result = { ...original };

  for (const [key, value] of Object.entries(variations)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = applyVariations(result[key] || {}, value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

function compareObjects(obj1: Record<string, any>, obj2: Record<string, any>): Record<string, any> {
  const differences: Record<string, any> = {};

  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  for (const key of allKeys) {
    if (!(key in obj1)) {
      differences[key] = { added: obj2[key] };
    } else if (!(key in obj2)) {
      differences[key] = { removed: obj1[key] };
    } else if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      const nestedDiff = compareObjects(obj1[key], obj2[key]);
      if (Object.keys(nestedDiff).length > 0) {
        differences[key] = nestedDiff;
      }
    } else if (obj1[key] !== obj2[key]) {
      differences[key] = {
        original: obj1[key],
        modified: obj2[key]
      };
    }
  }

  return differences;
}

// =========================
// PROMPT ANALYTICS
// =========================

export async function getPromptAnalytics(orgId: string, timeRange = 30): Promise<{
  totalSnapshots: number;
  uniquePrompts: number;
  mostUsedPrompts: Array<{ prompt: string; count: number }>;
  averageVariations: number;
  reproductionRate: number;
}> {
  try {
    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString();

    // Get all snapshots in time range
    const { data: snapshots, error } = await supabase
      .from('veo_prompt_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .gte('created_at', startDate);

    if (error) {
      throw new Error(`Failed to get prompt analytics: ${error.message}`);
    }

    // Get jobs with reproduction metadata
    const { data: reproducedJobs, error: jobError } = await supabase
      .from('veo_jobs')
      .select('metadata')
      .eq('org_id', orgId)
      .gte('created_at', startDate)
      .not('metadata->reproduced_from', 'is', null);

    if (jobError) {
      throw new Error(`Failed to get reproduced jobs: ${jobError.message}`);
    }

    // Calculate analytics
    const totalSnapshots = snapshots.length;
    const uniquePrompts = new Set(snapshots.map(s => s.prompt_hash)).size;
    const reproducedCount = reproducedJobs.length;

    // Most used prompts
    const promptCounts: Record<string, number> = {};
    snapshots.forEach(snapshot => {
      const prompt = snapshot.prompt_string.substring(0, 100); // First 100 chars
      promptCounts[prompt] = (promptCounts[prompt] || 0) + 1;
    });

    const mostUsedPrompts = Object.entries(promptCounts)
      .map(([prompt, count]) => ({ prompt, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSnapshots,
      uniquePrompts,
      mostUsedPrompts,
      averageVariations: totalSnapshots > 0 ? totalSnapshots / uniquePrompts : 0,
      reproductionRate: totalSnapshots > 0 ? reproducedCount / totalSnapshots : 0
    };
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get prompt analytics');
    throw error;
  }
}

// =========================
// EXPORTS
// =========================

export { PromptSnapshot, PromptVersionRequest, ReproduceRequest };

