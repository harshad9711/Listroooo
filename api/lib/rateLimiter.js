import { createClient } from '@supabase/supabase-js';
import PQueue from 'p-queue';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key'
);

// Rate limiting configuration
const RENDERS_PER_DAY = parseInt(process.env.RENDERS_PER_DAY || '10');
const RENDERS_CONCURRENCY = parseInt(process.env.RENDERS_CONCURRENCY || '2');

// Per-user concurrency queues
const userQueues = new Map();

// Get or create queue for user
function getUserQueue(userId) {
  if (!userQueues.has(userId)) {
    const queue = new PQueue({ 
      concurrency: RENDERS_CONCURRENCY,
      interval: 1000,
      intervalCap: 1
    });
    userQueues.set(userId, queue);
  }
  return userQueues.get(userId);
}

// Check daily quota for user
export async function checkDailyQuota(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count, error } = await supabase
      .from('veo_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());
    
    if (error) {
      console.error('Error checking daily quota:', error);
      return { allowed: false, error: 'Failed to check quota' };
    }
    
    const used = count || 0;
    const remaining = Math.max(0, RENDERS_PER_DAY - used);
    
    return {
      allowed: used < RENDERS_PER_DAY,
      used,
      remaining,
      limit: RENDERS_PER_DAY
    };
  } catch (error) {
    console.error('Error checking daily quota:', error);
    return { allowed: false, error: 'Failed to check quota' };
  }
}

// Rate limiting middleware
export function createRateLimitMiddleware() {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const quota = await checkDailyQuota(userId);
      
      if (!quota.allowed) {
        return res.status(429).json({
          error: 'Daily quota exceeded',
          quota: {
            used: quota.used,
            limit: quota.limit,
            remaining: quota.remaining
          }
        });
      }
      
      // Add quota info to request for use in response
      req.quota = quota;
      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      res.status(500).json({ error: 'Rate limit check failed' });
    }
  };
}

// Concurrency limiting middleware
export function createConcurrencyMiddleware() {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const queue = getUserQueue(userId);
      
      // Check if queue is at capacity
      if (queue.size >= RENDERS_CONCURRENCY) {
        return res.status(429).json({
          error: 'Too many concurrent renders',
          message: `Maximum ${RENDERS_CONCURRENCY} concurrent renders allowed`
        });
      }
      
      req.userQueue = queue;
      next();
    } catch (error) {
      console.error('Concurrency middleware error:', error);
      res.status(500).json({ error: 'Concurrency check failed' });
    }
  };
}

// Get user quota info (for frontend display)
export async function getUserQuotaInfo(userId) {
  try {
    const quota = await checkDailyQuota(userId);
    
    // Get current running jobs
    const { data: runningJobs, error } = await supabase
      .from('veo_jobs')
      .select('id, status, created_at')
      .eq('user_id', userId)
      .in('status', ['queued', 'running']);
    
    if (error) {
      console.error('Error getting running jobs:', error);
    }
    
    return {
      quota: {
        used: quota.used,
        remaining: quota.remaining,
        limit: quota.limit
      },
      concurrency: {
        running: runningJobs?.length || 0,
        limit: RENDERS_CONCURRENCY
      }
    };
  } catch (error) {
    console.error('Error getting user quota info:', error);
    return {
      quota: { used: 0, remaining: 0, limit: RENDERS_PER_DAY },
      concurrency: { running: 0, limit: RENDERS_CONCURRENCY }
    };
  }
}
