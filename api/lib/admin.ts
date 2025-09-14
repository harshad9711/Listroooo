import { createClient } from '@supabase/supabase-js';
import pino from 'pino';

const logger = pino({ name: 'admin' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface AuditLog {
  id: string;
  org_id?: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface ApprovalRequest {
  id: string;
  org_id: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  action: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  comments?: string;
}

// =========================
// AUDIT LOGGING
// =========================

export async function logAuditEvent(
  action: string,
  resourceType: string,
  resourceId?: string,
  details: Record<string, any> = {},
  orgId?: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('veo_audit_logs')
      .insert({
        org_id: orgId,
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (error) {
      logger.error({ error: error.message }, 'Failed to log audit event');
    } else {
      logger.info({ action, resourceType, resourceId }, 'Audit event logged');
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to log audit event');
  }
}

export async function getAuditLogs(
  orgId?: string,
  userId?: string,
  action?: string,
  resourceType?: string,
  startDate?: string,
  endDate?: string,
  limit = 100
): Promise<AuditLog[]> {
  try {
    let query = supabase
      .from('veo_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get audit logs: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get audit logs');
    throw error;
  }
}

// =========================
// ADMIN USER MANAGEMENT
// =========================

export async function createAdminUser(
  email: string,
  role: 'super_admin' | 'admin' | 'moderator',
  permissions: string[] = []
): Promise<AdminUser> {
  try {
    // Get default permissions based on role
    const defaultPermissions = getDefaultPermissions(role);
    const allPermissions = [...new Set([...defaultPermissions, ...permissions])];

    const { data, error } = await supabase
      .from('veo_admin_users')
      .insert({
        email,
        role,
        permissions: allPermissions,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create admin user: ${error.message}`);
    }

    logger.info({ adminUserId: data.id, email, role }, 'Admin user created');
    return data;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create admin user');
    throw error;
  }
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const { data, error } = await supabase
      .from('veo_admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get admin users: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get admin users');
    throw error;
  }
}

export async function updateAdminUser(
  adminUserId: string,
  updates: Partial<AdminUser>
): Promise<AdminUser> {
  try {
    const { data, error } = await supabase
      .from('veo_admin_users')
      .update(updates)
      .eq('id', adminUserId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update admin user: ${error.message}`);
    }

    logger.info({ adminUserId }, 'Admin user updated');
    return data;
  } catch (error) {
    logger.error({ adminUserId, error: error.message }, 'Failed to update admin user');
    throw error;
  }
}

export async function deleteAdminUser(adminUserId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('veo_admin_users')
      .delete()
      .eq('id', adminUserId);

    if (error) {
      throw new Error(`Failed to delete admin user: ${error.message}`);
    }

    logger.info({ adminUserId }, 'Admin user deleted');
  } catch (error) {
    logger.error({ adminUserId, error: error.message }, 'Failed to delete admin user');
    throw error;
  }
}

// =========================
// APPROVAL SYSTEM
// =========================

export async function createApprovalRequest(
  orgId: string,
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string,
  comments?: string
): Promise<ApprovalRequest> {
  try {
    const { data, error } = await supabase
      .from('veo_approval_requests')
      .insert({
        org_id: orgId,
        user_id: userId,
        resource_type: resourceType,
        resource_id: resourceId,
        action,
        status: 'pending',
        comments
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create approval request: ${error.message}`);
    }

    logger.info({ approvalId: data.id, orgId, userId, action }, 'Approval request created');
    return data;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create approval request');
    throw error;
  }
}

export async function getApprovalRequests(
  status?: 'pending' | 'approved' | 'rejected',
  orgId?: string,
  limit = 50
): Promise<ApprovalRequest[]> {
  try {
    let query = supabase
      .from('veo_approval_requests')
      .select('*')
      .order('requested_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get approval requests: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get approval requests');
    throw error;
  }
}

export async function approveRequest(
  approvalId: string,
  reviewedBy: string,
  comments?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('veo_approval_requests')
      .update({
        status: 'approved',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        comments
      })
      .eq('id', approvalId);

    if (error) {
      throw new Error(`Failed to approve request: ${error.message}`);
    }

    logger.info({ approvalId, reviewedBy }, 'Approval request approved');
  } catch (error) {
    logger.error({ approvalId, error: error.message }, 'Failed to approve request');
    throw error;
  }
}

export async function rejectRequest(
  approvalId: string,
  reviewedBy: string,
  comments?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('veo_approval_requests')
      .update({
        status: 'rejected',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        comments
      })
      .eq('id', approvalId);

    if (error) {
      throw new Error(`Failed to reject request: ${error.message}`);
    }

    logger.info({ approvalId, reviewedBy }, 'Approval request rejected');
  } catch (error) {
    logger.error({ approvalId, error: error.message }, 'Failed to reject request');
    throw error;
  }
}

// =========================
// SYSTEM MONITORING
// =========================

export async function getSystemHealth(): Promise<{
  database: boolean;
  redis: boolean;
  queues: Record<string, any>;
  storage: boolean;
  external_apis: Record<string, boolean>;
}> {
  try {
    // Check database
    const { error: dbError } = await supabase.from('veo_jobs').select('id').limit(1);
    const database = !dbError;

    // Check Redis (simplified)
    const redis = true; // In production, check Redis connection

    // Check queues
    const { veoStartQ, veoPollQ, veoPostQ } = await import('../queues/veo.js');
    const [startStats, pollStats, postStats] = await Promise.all([
      veoStartQ.getJobCounts(),
      veoPollQ.getJobCounts(),
      veoPostQ.getJobCounts()
    ]);

    const queues = {
      start: startStats,
      poll: pollStats,
      post: postStats
    };

    // Check storage (simplified)
    const storage = true; // In production, check S3/CloudFront

    // Check external APIs
    const external_apis = {
      gemini: true, // In production, ping Gemini API
      stripe: true, // In production, ping Stripe API
      tiktok: true, // In production, ping TikTok API
      meta: true,   // In production, ping Meta API
      youtube: true // In production, ping YouTube API
    };

    return {
      database,
      redis,
      queues,
      storage,
      external_apis
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get system health');
    throw error;
  }
}

export async function getSystemMetrics(): Promise<{
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalUsers: number;
  totalOrganizations: number;
  totalRevenue: number;
  averageJobDuration: number;
}> {
  try {
    // Get job statistics
    const { data: jobStats, error: jobError } = await supabase
      .from('veo_jobs')
      .select('status, created_at, completed_at, started_at');

    if (jobError) {
      throw new Error(`Failed to get job statistics: ${jobError.message}`);
    }

    const totalJobs = jobStats.length;
    const activeJobs = jobStats.filter(j => j.status === 'processing').length;
    const completedJobs = jobStats.filter(j => j.status === 'completed').length;
    const failedJobs = jobStats.filter(j => j.status === 'failed').length;

    // Get user statistics
    const { count: totalUsers, error: userError } = await supabase
      .from('veo_organizations')
      .select('*', { count: 'exact', head: true });

    if (userError) {
      throw new Error(`Failed to get user statistics: ${userError.message}`);
    }

    // Get organization statistics
    const { count: totalOrganizations, error: orgError } = await supabase
      .from('veo_organizations')
      .select('*', { count: 'exact', head: true });

    if (orgError) {
      throw new Error(`Failed to get organization statistics: ${orgError.message}`);
    }

    // Get revenue statistics
    const { data: revenueData, error: revenueError } = await supabase
      .from('veo_usage_records')
      .select('total_cents');

    if (revenueError) {
      throw new Error(`Failed to get revenue statistics: ${revenueError.message}`);
    }

    const totalRevenue = revenueData.reduce((sum, record) => sum + (record.total_cents || 0), 0);

    // Calculate average job duration
    const completedJobsWithDuration = jobStats.filter(j => 
      j.status === 'completed' && j.started_at && j.completed_at
    );

    const averageJobDuration = completedJobsWithDuration.length > 0
      ? completedJobsWithDuration.reduce((sum, job) => {
          const duration = new Date(job.completed_at).getTime() - new Date(job.started_at).getTime();
          return sum + duration;
        }, 0) / completedJobsWithDuration.length
      : 0;

    return {
      totalJobs,
      activeJobs,
      completedJobs,
      failedJobs,
      totalUsers: totalUsers || 0,
      totalOrganizations: totalOrganizations || 0,
      totalRevenue,
      averageJobDuration
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get system metrics');
    throw error;
  }
}

// =========================
// HELPER FUNCTIONS
// =========================

function getDefaultPermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    super_admin: [
      'users.manage',
      'organizations.manage',
      'system.manage',
      'audit.view',
      'approvals.manage',
      'analytics.view',
      'billing.manage'
    ],
    admin: [
      'users.view',
      'organizations.view',
      'audit.view',
      'approvals.manage',
      'analytics.view'
    ],
    moderator: [
      'content.moderate',
      'approvals.review',
      'audit.view'
    ]
  };

  return permissions[role] || [];
}

// =========================
// EXPORTS
// =========================

export { AuditLog, AdminUser, ApprovalRequest };

