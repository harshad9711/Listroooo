import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import pino from 'pino';
import { cacheKey } from './rag.js';

const logger = pino({ name: 'composer-cache' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface ComposerCacheEntry {
  json: any;
  prompt: string;
  ragContext?: string;
  ragChunks?: any[];
  complianceRules?: string[];
  cached: boolean;
  cacheKey: string;
  createdAt: string;
  hitCount: number;
}

export interface ComposerCacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Maximum cache size
  enableDeduplication?: boolean;
}

// =========================
// CONFIGURATION
// =========================

const CACHE_TTL = 24 * 60 * 60; // 24 hours
const CACHE_MAX_SIZE = 10000; // Maximum cache entries
const CACHE_PREFIX = 'composer:';

// =========================
// CACHE KEY GENERATION
// =========================

export function generateCacheKey(
  orgId: string,
  idea: string,
  goal?: string,
  platform?: string,
  brandKitId?: string,
  ragChunkIds?: string[]
): string {
  // Use the RAG cache key function for consistency
  const payload = {
    idea: idea.trim().toLowerCase(),
    goal: goal?.trim().toLowerCase(),
    platform,
    brandKitId
  };
  
  return cacheKey(orgId, payload, ragChunkIds || []);
}

// =========================
// REDIS CACHE OPERATIONS
// =========================

export class ComposerCache {
  private redis: any;
  private options: ComposerCacheOptions;

  constructor(redisClient: any, options: ComposerCacheOptions = {}) {
    this.redis = redisClient;
    this.options = {
      ttl: CACHE_TTL,
      maxSize: CACHE_MAX_SIZE,
      enableDeduplication: true,
      ...options
    };
  }

  async get(cacheKey: string): Promise<ComposerCacheEntry | null> {
    try {
      const cached = await this.redis.get(cacheKey);
      if (!cached) return null;

      const entry = JSON.parse(cached);
      
      // Update hit count
      await this.incrementHitCount(cacheKey);
      
      logger.debug({ cacheKey }, 'Cache hit');
      return entry;
    } catch (error) {
      logger.error({ cacheKey, error: error.message }, 'Failed to get from cache');
      return null;
    }
  }

  async set(cacheKey: string, entry: ComposerCacheEntry): Promise<void> {
    try {
      const serialized = JSON.stringify(entry);
      await this.redis.setex(cacheKey, this.options.ttl!, serialized);
      
      // Update cache metadata in database
      await this.updateCacheMetadata(cacheKey, entry);
      
      logger.debug({ cacheKey }, 'Cache set');
    } catch (error) {
      logger.error({ cacheKey, error: error.message }, 'Failed to set cache');
    }
  }

  async delete(cacheKey: string): Promise<void> {
    try {
      await this.redis.del(cacheKey);
      await this.deleteCacheMetadata(cacheKey);
      
      logger.debug({ cacheKey }, 'Cache deleted');
    } catch (error) {
      logger.error({ cacheKey, error: error.message }, 'Failed to delete cache');
    }
  }

  async clear(orgId?: string): Promise<void> {
    try {
      const pattern = orgId ? `${CACHE_PREFIX}${orgId}:*` : `${CACHE_PREFIX}*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      // Clear database metadata
      if (orgId) {
        await supabase
          .from('composer_cache_metadata')
          .delete()
          .eq('org_id', orgId);
      } else {
        await supabase
          .from('composer_cache_metadata')
          .delete();
      }
      
      logger.info({ orgId, clearedCount: keys.length }, 'Cache cleared');
    } catch (error) {
      logger.error({ orgId, error: error.message }, 'Failed to clear cache');
    }
  }

  async getStats(orgId?: string): Promise<{
    totalEntries: number;
    hitRate: number;
    avgHitCount: number;
    oldestEntry: string;
    newestEntry: string;
  }> {
    try {
      let query = supabase
        .from('composer_cache_metadata')
        .select('*')
        .order('last_accessed_at', { ascending: false });

      if (orgId) {
        query = query.eq('org_id', orgId);
      }

      const { data: entries } = await query;

      if (!entries || entries.length === 0) {
        return {
          totalEntries: 0,
          hitRate: 0,
          avgHitCount: 0,
          oldestEntry: 'Never',
          newestEntry: 'Never'
        };
      }

      const totalHits = entries.reduce((sum, entry) => sum + entry.hit_count, 0);
      const avgHitCount = totalHits / entries.length;
      const hitRate = totalHits / (totalHits + entries.length); // Simplified hit rate

      return {
        totalEntries: entries.length,
        hitRate,
        avgHitCount,
        oldestEntry: entries[entries.length - 1]?.last_accessed_at || 'Never',
        newestEntry: entries[0]?.last_accessed_at || 'Never'
      };
    } catch (error) {
      logger.error({ orgId, error: error.message }, 'Failed to get cache stats');
      throw error;
    }
  }

  private async incrementHitCount(cacheKey: string): Promise<void> {
    try {
      await supabase
        .from('composer_cache_metadata')
        .update({
          hit_count: supabase.raw('hit_count + 1'),
          last_accessed_at: new Date().toISOString()
        })
        .eq('cache_key', cacheKey);
    } catch (error) {
      logger.error({ cacheKey, error: error.message }, 'Failed to increment hit count');
    }
  }

  private async updateCacheMetadata(cacheKey: string, entry: ComposerCacheEntry): Promise<void> {
    try {
      const orgId = cacheKey.split(':')[1]; // Extract orgId from cache key
      
      await supabase
        .from('composer_cache_metadata')
        .upsert({
          org_id: orgId,
          cache_key: cacheKey,
          hit_count: 0,
          last_accessed_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error({ cacheKey, error: error.message }, 'Failed to update cache metadata');
    }
  }

  private async deleteCacheMetadata(cacheKey: string): Promise<void> {
    try {
      await supabase
        .from('composer_cache_metadata')
        .delete()
        .eq('cache_key', cacheKey);
    } catch (error) {
      logger.error({ cacheKey, error: error.message }, 'Failed to delete cache metadata');
    }
  }
}

// =========================
// CACHE WRAPPER FOR COMPOSER
// =========================

export async function withComposerCache<T>(
  cache: ComposerCache,
  cacheKey: string,
  composerFn: () => Promise<T>,
  options: { enableCache?: boolean } = {}
): Promise<T & { cached: boolean }> {
  const { enableCache = true } = options;

  if (!enableCache) {
    const result = await composerFn();
    return { ...result, cached: false };
  }

  // Try to get from cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  // Execute composer function
  const result = await composerFn();
  
  // Store in cache
  const cacheEntry: ComposerCacheEntry = {
    ...result,
    cached: false,
    cacheKey,
    createdAt: new Date().toISOString(),
    hitCount: 0
  };

  await cache.set(cacheKey, cacheEntry);
  
  return { ...result, cached: false };
}

// =========================
// CACHE CLEANUP
// =========================

export async function cleanupExpiredCache(orgId?: string): Promise<{
  cleaned: number;
  errors: string[];
}> {
  try {
    const cutoffDate = new Date(Date.now() - CACHE_TTL * 1000).toISOString();
    
    let query = supabase
      .from('composer_cache_metadata')
      .select('cache_key')
      .lt('last_accessed_at', cutoffDate);

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data: expiredEntries } = await query;
    
    if (!expiredEntries || expiredEntries.length === 0) {
      return { cleaned: 0, errors: [] };
    }

    const cacheKeys = expiredEntries.map(entry => entry.cache_key);
    const errors: string[] = [];
    let cleaned = 0;

    // Delete from Redis
    for (const cacheKey of cacheKeys) {
      try {
        await cache.delete(cacheKey);
        cleaned++;
      } catch (error) {
        errors.push(`Failed to delete ${cacheKey}: ${error.message}`);
      }
    }

    logger.info({ orgId, cleaned, errors: errors.length }, 'Cache cleanup completed');
    return { cleaned, errors };
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to cleanup expired cache');
    throw error;
  }
}

// =========================
// CACHE ANALYTICS
// =========================

export async function getCacheAnalytics(orgId?: string): Promise<{
  totalEntries: number;
  hitRate: number;
  avgHitCount: number;
  topKeys: Array<{ key: string; hits: number }>;
  sizeByOrg: Array<{ orgId: string; count: number }>;
}> {
  try {
    const stats = await cache.getStats(orgId);
    
    // Get top cache keys by hit count
    let query = supabase
      .from('composer_cache_metadata')
      .select('cache_key, hit_count')
      .order('hit_count', { ascending: false })
      .limit(10);

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data: topKeys } = await query;

    // Get cache size by organization
    const { data: sizeByOrg } = await supabase
      .from('composer_cache_metadata')
      .select('org_id')
      .select('count', { count: 'exact' })
      .group('org_id');

    return {
      ...stats,
      topKeys: topKeys?.map(entry => ({
        key: entry.cache_key,
        hits: entry.hit_count
      })) || [],
      sizeByOrg: sizeByOrg?.map(entry => ({
        orgId: entry.org_id,
        count: entry.count
      })) || []
    };
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get cache analytics');
    throw error;
  }
}

// =========================
// EXPORTS
// =========================

export { ComposerCacheEntry, ComposerCacheOptions };
