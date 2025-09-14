import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import pino from 'pino';

const logger = pino({ name: 'api-keys' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// API KEY GENERATION
// =========================

export function mintApiKey() {
  const prefix = 'vk';
  const raw = `${prefix}_${randomBytes(8).toString('hex')}_${randomBytes(16).toString('hex')}`;
  const hash = createHash('sha256').update(raw).digest('hex');
  const shown = raw; // only show once
  return { shown, hash, prefix };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function getKeyPrefix(key: string): string {
  return key.substring(0, 2); // 'vk'
}

// =========================
// API KEY MANAGEMENT
// =========================

export async function createApiKey(organizationId: string, userId: string, keyData: {
  name: string;
  permissions?: Record<string, boolean>;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  expiresAt?: string;
}) {
  try {
    const { name, permissions = {}, rateLimitPerMinute = 60, rateLimitPerHour = 1000, expiresAt } = keyData;

    // Generate API key
    const { shown, hash, prefix } = mintApiKey();

    // Store in database
    const { data, error } = await supabase
      .from('veo_api_keys')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        name,
        key_hash: hash,
        key_prefix: prefix,
        permissions,
        rate_limit_per_minute: rateLimitPerMinute,
        rate_limit_per_hour: rateLimitPerHour,
        expires_at: expiresAt ? new Date(expiresAt) : null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`);
    }

    logger.info({ organizationId, userId, keyId: data.id }, 'API key created');
    
    // Return the actual key (only time it's returned)
    return {
      ...data,
      key: shown, // Only returned on creation
    };
  } catch (error) {
    logger.error({ organizationId, userId, error: error.message }, 'Failed to create API key');
    throw error;
  }
}

export async function getApiKeys(organizationId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('veo_api_keys')
      .select('id, name, key_prefix, permissions, rate_limit_per_minute, rate_limit_per_hour, last_used_at, expires_at, is_active, created_at')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get API keys: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ organizationId, userId, error: error.message }, 'Failed to get API keys');
    throw error;
  }
}

export async function getApiKey(organizationId: string, keyId: string) {
  try {
    const { data, error } = await supabase
      .from('veo_api_keys')
      .select('*')
      .eq('id', keyId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      throw new Error(`API key not found: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error({ organizationId, keyId, error: error.message }, 'Failed to get API key');
    throw error;
  }
}

export async function updateApiKey(organizationId: string, keyId: string, updateData: {
  name?: string;
  permissions?: Record<string, boolean>;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  isActive?: boolean;
  expiresAt?: string;
}) {
  try {
    const { name, permissions, rateLimitPerMinute, rateLimitPerHour, isActive, expiresAt } = updateData;

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (permissions !== undefined) updateFields.permissions = permissions;
    if (rateLimitPerMinute !== undefined) updateFields.rate_limit_per_minute = rateLimitPerMinute;
    if (rateLimitPerHour !== undefined) updateFields.rate_limit_per_hour = rateLimitPerHour;
    if (isActive !== undefined) updateFields.is_active = isActive;
    if (expiresAt !== undefined) updateFields.expires_at = expiresAt ? new Date(expiresAt) : null;

    const { data, error } = await supabase
      .from('veo_api_keys')
      .update(updateFields)
      .eq('id', keyId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update API key: ${error.message}`);
    }

    logger.info({ organizationId, keyId }, 'API key updated');
    return data;
  } catch (error) {
    logger.error({ organizationId, keyId, error: error.message }, 'Failed to update API key');
    throw error;
  }
}

export async function deleteApiKey(organizationId: string, keyId: string) {
  try {
    const { error } = await supabase
      .from('veo_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to delete API key: ${error.message}`);
    }

    logger.info({ organizationId, keyId }, 'API key deleted');
    return { success: true };
  } catch (error) {
    logger.error({ organizationId, keyId, error: error.message }, 'Failed to delete API key');
    throw error;
  }
}

// =========================
// API KEY AUTHENTICATION
// =========================

export async function authenticateApiKey(apiKey: string) {
  try {
    if (!apiKey || !apiKey.startsWith('vk_')) {
      throw new Error('Invalid API key format');
    }

    const keyHash = hashApiKey(apiKey);
    const keyPrefix = getKeyPrefix(apiKey);

    // Find API key
    const { data, error } = await supabase
      .from('veo_api_keys')
      .select(`
        *,
        veo_organizations!inner(*)
      `)
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new Error('Invalid API key');
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      throw new Error('API key expired');
    }

    // Update last used
    await supabase
      .from('veo_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);

    logger.info({ keyId: data.id, organizationId: data.organization_id }, 'API key authenticated');
    
    return {
      apiKeyId: data.id,
      organizationId: data.organization_id,
      userId: data.user_id,
      permissions: data.permissions,
      rateLimitPerMinute: data.rate_limit_per_minute,
      rateLimitPerHour: data.rate_limit_per_hour,
      organization: data.veo_organizations,
    };
  } catch (error) {
    logger.error({ error: error.message }, 'API key authentication failed');
    throw error;
  }
}

// =========================
// RATE LIMITING
// =========================

export async function checkRateLimit(apiKeyId: string, endpoint: string, method: string) {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get API key limits
    const { data: apiKey, error: keyError } = await supabase
      .from('veo_api_keys')
      .select('rate_limit_per_minute, rate_limit_per_hour')
      .eq('id', apiKeyId)
      .single();

    if (keyError) {
      throw new Error('API key not found');
    }

    // Check minute limit
    const { count: minuteCount, error: minuteError } = await supabase
      .from('veo_api_key_usage')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId)
      .gte('created_at', oneMinuteAgo.toISOString());

    if (minuteError) {
      throw new Error('Failed to check minute rate limit');
    }

    if (minuteCount >= apiKey.rate_limit_per_minute) {
      throw new Error('Rate limit exceeded: too many requests per minute');
    }

    // Check hour limit
    const { count: hourCount, error: hourError } = await supabase
      .from('veo_api_key_usage')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId)
      .gte('created_at', oneHourAgo.toISOString());

    if (hourError) {
      throw new Error('Failed to check hour rate limit');
    }

    if (hourCount >= apiKey.rate_limit_per_hour) {
      throw new Error('Rate limit exceeded: too many requests per hour');
    }

    return {
      minuteRemaining: apiKey.rate_limit_per_minute - minuteCount,
      hourRemaining: apiKey.rate_limit_per_hour - hourCount,
    };
  } catch (error) {
    logger.error({ apiKeyId, endpoint, method, error: error.message }, 'Rate limit check failed');
    throw error;
  }
}

export async function recordApiUsage(apiKeyId: string, endpoint: string, method: string, statusCode: number, responseTime: number, userAgent: string, ipAddress: string) {
  try {
    const { error } = await supabase
      .from('veo_api_key_usage')
      .insert({
        api_key_id: apiKeyId,
        endpoint,
        method,
        status_code: statusCode,
        response_time_ms: responseTime,
        user_agent: userAgent,
        ip_address: ipAddress,
      });

    if (error) {
      logger.error({ apiKeyId, error: error.message }, 'Failed to record API usage');
    }
  } catch (error) {
    logger.error({ apiKeyId, error: error.message }, 'Failed to record API usage');
  }
}

// =========================
// PERMISSION CHECKING
// =========================

export function checkPermission(auth: any, permission: string): boolean {
  const { permissions } = auth;
  
  if (!permissions || typeof permissions !== 'object') {
    return false;
  }

  // Check if permission is explicitly granted
  if (permissions[permission] === true) {
    return true;
  }

  // Check wildcard permissions
  if (permissions['*'] === true) {
    return true;
  }

  // Check resource-specific permissions
  const resourcePermissions = permissions[permission.split('.')[0]];
  if (resourcePermissions && resourcePermissions['*'] === true) {
    return true;
  }

  return false;
}

export function requirePermission(auth: any, permission: string) {
  if (!checkPermission(auth, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

// =========================
// EXPORTS
// =========================

export const PERMISSIONS = {
  // Video generation
  VIDEOS_CREATE: 'videos.create',
  VIDEOS_READ: 'videos.read',
  VIDEOS_UPDATE: 'videos.update',
  VIDEOS_DELETE: 'videos.delete',
  
  // Templates
  TEMPLATES_CREATE: 'templates.create',
  TEMPLATES_READ: 'templates.read',
  TEMPLATES_UPDATE: 'templates.update',
  TEMPLATES_DELETE: 'templates.delete',
  
  // Brand kits
  BRAND_KITS_CREATE: 'brand_kits.create',
  BRAND_KITS_READ: 'brand_kits.read',
  BRAND_KITS_UPDATE: 'brand_kits.update',
  BRAND_KITS_DELETE: 'brand_kits.delete',
  
  // Analytics
  ANALYTICS_READ: 'analytics.read',
  
  // Admin
  ADMIN_ALL: 'admin.*',
};

