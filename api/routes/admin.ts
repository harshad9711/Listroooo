import { Router } from 'express';
import { 
  logAuditEvent,
  getAuditLogs,
  createAdminUser,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  createApprovalRequest,
  getApprovalRequests,
  approveRequest,
  rejectRequest,
  getSystemHealth,
  getSystemMetrics,
  AuditLog,
  AdminUser,
  ApprovalRequest
} from '../lib/admin.js';
import pino from 'pino';

const logger = pino({ name: 'admin-routes' });
const router = Router();

// =========================
// AUDIT LOGS
// =========================

router.get('/audit/logs', async (req, res) => {
  try {
    const { 
      orgId, 
      userId, 
      action, 
      resourceType, 
      startDate, 
      endDate, 
      limit = 100 
    } = req.query;

    const logs = await getAuditLogs(
      orgId as string,
      userId as string,
      action as string,
      resourceType as string,
      startDate as string,
      endDate as string,
      parseInt(limit as string)
    );

    res.json(logs);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get audit logs');
    res.status(500).json({ error: error.message });
  }
});

router.post('/audit/log', async (req, res) => {
  try {
    const { 
      action, 
      resourceType, 
      resourceId, 
      details, 
      orgId, 
      userId, 
      ipAddress, 
      userAgent 
    } = req.body;

    // Validate required fields
    if (!action || !resourceType) {
      return res.status(400).json({ error: 'Action and resource type required' });
    }

    await logAuditEvent(
      action,
      resourceType,
      resourceId,
      details,
      orgId,
      userId,
      ipAddress,
      userAgent
    );

    res.json({ message: 'Audit event logged successfully' });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to log audit event');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// ADMIN USER MANAGEMENT
// =========================

router.post('/users', async (req, res) => {
  try {
    const { email, role, permissions } = req.body;

    // Validate required fields
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role required' });
    }

    // Validate role
    if (!['super_admin', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const adminUser = await createAdminUser(email, role, permissions);
    
    res.json({
      adminUser,
      message: 'Admin user created successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create admin user');
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const adminUsers = await getAdminUsers();
    res.json(adminUsers);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get admin users');
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:adminUserId', async (req, res) => {
  try {
    const { adminUserId } = req.params;
    const updates = req.body;

    const adminUser = await updateAdminUser(adminUserId, updates);
    res.json({
      adminUser,
      message: 'Admin user updated successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to update admin user');
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:adminUserId', async (req, res) => {
  try {
    const { adminUserId } = req.params;

    await deleteAdminUser(adminUserId);
    res.json({ message: 'Admin user deleted successfully' });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to delete admin user');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// APPROVAL SYSTEM
// =========================

router.post('/approvals', async (req, res) => {
  try {
    const { orgId, userId, resourceType, resourceId, action, comments } = req.body;

    // Validate required fields
    if (!orgId || !userId || !resourceType || !resourceId || !action) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const approvalRequest = await createApprovalRequest(
      orgId,
      userId,
      resourceType,
      resourceId,
      action,
      comments
    );
    
    res.json({
      approvalRequest,
      message: 'Approval request created successfully'
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create approval request');
    res.status(500).json({ error: error.message });
  }
});

router.get('/approvals', async (req, res) => {
  try {
    const { status, orgId, limit = 50 } = req.query;

    const approvalRequests = await getApprovalRequests(
      status as 'pending' | 'approved' | 'rejected',
      orgId as string,
      parseInt(limit as string)
    );
    
    res.json(approvalRequests);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get approval requests');
    res.status(500).json({ error: error.message });
  }
});

router.post('/approvals/:approvalId/approve', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const { reviewedBy, comments } = req.body;

    if (!reviewedBy) {
      return res.status(400).json({ error: 'Reviewed by required' });
    }

    await approveRequest(approvalId, reviewedBy, comments);
    res.json({ message: 'Approval request approved successfully' });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to approve request');
    res.status(500).json({ error: error.message });
  }
});

router.post('/approvals/:approvalId/reject', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const { reviewedBy, comments } = req.body;

    if (!reviewedBy) {
      return res.status(400).json({ error: 'Reviewed by required' });
    }

    await rejectRequest(approvalId, reviewedBy, comments);
    res.json({ message: 'Approval request rejected successfully' });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to reject request');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// SYSTEM MONITORING
// =========================

router.get('/health', async (req, res) => {
  try {
    const health = await getSystemHealth();
    res.json(health);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get system health');
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const metrics = await getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get system metrics');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// ADMIN DASHBOARD
// =========================

router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get system metrics
    const metrics = await getSystemMetrics();
    
    // Get recent audit logs
    const recentLogs = await getAuditLogs(
      undefined,
      undefined,
      undefined,
      undefined,
      startDate as string,
      endDate as string,
      50
    );

    // Get pending approvals
    const pendingApprovals = await getApprovalRequests('pending', undefined, 20);

    // Get admin users
    const adminUsers = await getAdminUsers();

    const dashboard = {
      metrics,
      recentLogs: recentLogs.slice(0, 10),
      pendingApprovals: pendingApprovals.slice(0, 10),
      adminUsers: adminUsers.length,
      systemHealth: await getSystemHealth()
    };

    res.json(dashboard);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get admin dashboard');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// SYSTEM ACTIONS
// =========================

router.post('/system/cleanup', async (req, res) => {
  try {
    const { type, olderThan } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Cleanup type required' });
    }

    // Perform cleanup based on type
    let cleaned = 0;
    
    switch (type) {
      case 'audit_logs':
        // Clean up old audit logs
        const cutoffDate = olderThan || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const { error: auditError } = await supabase
          .from('veo_audit_logs')
          .delete()
          .lt('created_at', cutoffDate);
        
        if (auditError) {
          throw new Error(`Failed to clean audit logs: ${auditError.message}`);
        }
        break;

      case 'completed_jobs':
        // Clean up old completed jobs
        const jobCutoffDate = olderThan || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { error: jobError } = await supabase
          .from('veo_jobs')
          .delete()
          .eq('status', 'completed')
          .lt('completed_at', jobCutoffDate);
        
        if (jobError) {
          throw new Error(`Failed to clean completed jobs: ${jobError.message}`);
        }
        break;

      default:
        return res.status(400).json({ error: 'Invalid cleanup type' });
    }

    res.json({ 
      message: `${type} cleanup completed successfully`,
      cleaned
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to perform system cleanup');
    res.status(500).json({ error: error.message });
  }
});

router.post('/system/backup', async (req, res) => {
  try {
    const { tables, format = 'json' } = req.body;

    if (!tables || !Array.isArray(tables)) {
      return res.status(400).json({ error: 'Tables array required' });
    }

    // Perform backup for specified tables
    const backup = {};
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1000); // Limit for safety
      
      if (error) {
        throw new Error(`Failed to backup table ${table}: ${error.message}`);
      }
      
      backup[table] = data;
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertBackupToCSV(backup);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="veo3-backup.csv"');
      res.send(csv);
    } else {
      res.json(backup);
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to perform system backup');
    res.status(500).json({ error: error.message });
  }
});

// =========================
// HELPER FUNCTIONS
// =========================

function convertBackupToCSV(backup: Record<string, any[]>): string {
  const csvRows = [];
  
  for (const [tableName, data] of Object.entries(backup)) {
    if (data.length === 0) continue;
    
    csvRows.push(`# Table: ${tableName}`);
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).replace(/"/g, '""');
      });
      csvRows.push(values.map(v => `"${v}"`).join(','));
    }
    
    csvRows.push(''); // Empty line between tables
  }
  
  return csvRows.join('\n');
}

export default router;

