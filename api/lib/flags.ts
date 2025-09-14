import { createClient } from '@supabase/supabase-js';
import pino from 'pino';

const logger = pino({ name: 'feature-flags' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface FlagConfig {
  name: string;
  description: string;
  default: boolean;
  canary?: {
    enabled: boolean;
    percentage: number;
    conditions?: Record<string, any>;
  };
}

// =========================
// CONFIGURATION
// =========================

const FLAG_DEFAULTS: FeatureFlags = JSON.parse(
  process.env.FLAG_DEFAULTS || '{"composer_rag": true, "composer_cache": true, "breaker_veo": true}'
);

const FLAG_CONFIGS: Record<string, FlagConfig> = {
  composer_rag: {
    name: 'Composer RAG',
    description: 'Enable RAG (Retrieval Augmented Generation) for the composer',
    default: true,
    canary: {
      enabled: true,
      percentage: 10,
      conditions: {
        min_org_size: 5,
        has_kb_docs: true
      }
    }
  },
  composer_cache: {
    name: 'Composer Cache',
    description: 'Enable Redis caching for composer responses',
    default: true,
    canary: {
      enabled: true,
      percentage: 50
    }
  },
  breaker_veo: {
    name: 'Veo Circuit Breaker',
    description: 'Enable circuit breaker for Veo API calls',
    default: true,
    canary: {
      enabled: true,
      percentage: 100
    }
  },
  debug_dashboard: {
    name: 'Debug Dashboard',
    description: 'Enable debug/observability dashboard',
    default: false,
    canary: {
      enabled: true,
      percentage: 20,
      conditions: {
        role: ['owner', 'admin']
      }
    }
  },
  job_cancellation: {
    name: 'Job Cancellation',
    description: 'Enable job cancellation functionality',
    default: true,
    canary: {
      enabled: true,
      percentage: 100
    }
  }
};

// =========================
// CORE FUNCTIONS
// =========================

export async function getFlags(orgId: string): Promise<FeatureFlags> {
  try {
    // Get flags from database
    const { data, error } = await supabase
      .from('feature_flags')
      .select('flags')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      logger.error({ orgId, error: error.message }, 'Failed to get feature flags');
      return FLAG_DEFAULTS;
    }

    const dbFlags = data?.flags || {};
    
    // Merge with defaults
    const flags = { ...FLAG_DEFAULTS, ...dbFlags };
    
    // Apply canary logic
    const canaryFlags = await applyCanaryLogic(orgId, flags);
    
    logger.debug({ orgId, flags: canaryFlags }, 'Feature flags retrieved');
    return canaryFlags;
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get feature flags');
    return FLAG_DEFAULTS;
  }
}

export async function isEnabled(orgId: string, key: string): Promise<boolean> {
  try {
    const flags = await getFlags(orgId);
    return !!flags[key];
  } catch (error) {
    logger.error({ orgId, key, error: error.message }, 'Failed to check feature flag');
    return FLAG_DEFAULTS[key] || false;
  }
}

export async function setFlags(orgId: string, flags: FeatureFlags): Promise<void> {
  try {
    const { error } = await supabase
      .from('feature_flags')
      .upsert({
        org_id: orgId,
        flags,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to set feature flags: ${error.message}`);
    }

    logger.info({ orgId, flags }, 'Feature flags updated');
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to set feature flags');
    throw error;
  }
}

export async function updateFlag(orgId: string, key: string, value: boolean): Promise<void> {
  try {
    const currentFlags = await getFlags(orgId);
    const updatedFlags = { ...currentFlags, [key]: value };
    
    await setFlags(orgId, updatedFlags);
    
    logger.info({ orgId, key, value }, 'Feature flag updated');
  } catch (error) {
    logger.error({ orgId, key, value, error: error.message }, 'Failed to update feature flag');
    throw error;
  }
}

// =========================
// CANARY LOGIC
// =========================

async function applyCanaryLogic(orgId: string, flags: FeatureFlags): Promise<FeatureFlags> {
  const canaryFlags = { ...flags };

  for (const [key, config] of Object.entries(FLAG_CONFIGS)) {
    if (!config.canary?.enabled) continue;
    
    // Check if flag is already explicitly set
    if (key in flags) continue;
    
    // Apply canary logic
    const shouldEnable = await evaluateCanaryRule(orgId, key, config);
    canaryFlags[key] = shouldEnable;
  }

  return canaryFlags;
}

async function evaluateCanaryRule(orgId: string, key: string, config: FlagConfig): Promise<boolean> {
  try {
    const canary = config.canary!;
    
    // Check percentage-based rollout
    const orgHash = hashString(orgId);
    const percentage = (orgHash % 100) + 1;
    
    if (percentage > canary.percentage) {
      return config.default;
    }
    
    // Check additional conditions
    if (canary.conditions) {
      const conditionsMet = await checkCanaryConditions(orgId, canary.conditions);
      if (!conditionsMet) {
        return config.default;
      }
    }
    
    return true; // Enable the feature
  } catch (error) {
    logger.error({ orgId, key, error: error.message }, 'Failed to evaluate canary rule');
    return config.default;
  }
}

async function checkCanaryConditions(orgId: string, conditions: Record<string, any>): Promise<boolean> {
  try {
    // Check minimum org size
    if (conditions.min_org_size) {
      const { count } = await supabase
        .from('veo_organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);
      
      if ((count || 0) < conditions.min_org_size) {
        return false;
      }
    }
    
    // Check if org has knowledge base docs
    if (conditions.has_kb_docs) {
      const { count } = await supabase
        .from('kb_docs')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);
      
      if ((count || 0) === 0) {
        return false;
      }
    }
    
    // Check user role
    if (conditions.role) {
      const { data: member } = await supabase
        .from('veo_organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', 'current_user_id') // This would need to be passed in
        .single();
      
      if (!member || !conditions.role.includes(member.role)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error({ orgId, conditions, error: error.message }, 'Failed to check canary conditions');
    return false;
  }
}

// =========================
// UTILITY FUNCTIONS
// =========================

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export function getFlagConfigs(): Record<string, FlagConfig> {
  return FLAG_CONFIGS;
}

export function getDefaultFlags(): FeatureFlags {
  return FLAG_DEFAULTS;
}

// =========================
// BULK OPERATIONS
// =========================

export async function getFlagsForOrgs(orgIds: string[]): Promise<Record<string, FeatureFlags>> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('org_id, flags')
      .in('org_id', orgIds);

    if (error) {
      throw new Error(`Failed to get flags for orgs: ${error.message}`);
    }

    const result: Record<string, FeatureFlags> = {};
    
    for (const orgId of orgIds) {
      const orgFlags = data?.find(f => f.org_id === orgId)?.flags || {};
      result[orgId] = { ...FLAG_DEFAULTS, ...orgFlags };
    }

    return result;
  } catch (error) {
    logger.error({ orgIds, error: error.message }, 'Failed to get flags for orgs');
    throw error;
  }
}

export async function resetFlagsToDefaults(orgId: string): Promise<void> {
  try {
    await setFlags(orgId, FLAG_DEFAULTS);
    logger.info({ orgId }, 'Feature flags reset to defaults');
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to reset flags to defaults');
    throw error;
  }
}

// =========================
// ANALYTICS
// =========================

export async function getFlagAnalytics(): Promise<{
  totalOrgs: number;
  flagUsage: Record<string, { enabled: number; disabled: number; percentage: number }>;
  canaryStats: Record<string, { canaryEnabled: number; canaryDisabled: number }>;
}> {
  try {
    // Get total org count
    const { count: totalOrgs } = await supabase
      .from('veo_organizations')
      .select('*', { count: 'exact', head: true });

    // Get flag usage stats
    const { data: flagData } = await supabase
      .from('feature_flags')
      .select('flags');

    const flagUsage: Record<string, { enabled: number; disabled: number; percentage: number }> = {};
    const canaryStats: Record<string, { canaryEnabled: number; canaryDisabled: number }> = {};

    // Initialize counters
    for (const key of Object.keys(FLAG_CONFIGS)) {
      flagUsage[key] = { enabled: 0, disabled: 0, percentage: 0 };
      canaryStats[key] = { canaryEnabled: 0, canaryDisabled: 0 };
    }

    // Count flag usage
    for (const org of flagData || []) {
      const flags = org.flags || {};
      
      for (const [key, value] of Object.entries(flags)) {
        if (flagUsage[key]) {
          if (value) {
            flagUsage[key].enabled++;
          } else {
            flagUsage[key].disabled++;
          }
        }
      }
    }

    // Calculate percentages
    for (const [key, stats] of Object.entries(flagUsage)) {
      const total = stats.enabled + stats.disabled;
      stats.percentage = total > 0 ? (stats.enabled / total) * 100 : 0;
    }

    return {
      totalOrgs: totalOrgs || 0,
      flagUsage,
      canaryStats
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get flag analytics');
    throw error;
  }
}

// =========================
// EXPORTS
// =========================

export { FeatureFlags, FlagConfig };

