/**
 * Data Governance Service
 * Handles GDPR export/delete and retention TTL
 */

import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import archiver from 'archiver';
import pino from 'pino';

const logger = pino({ name: 'data-governance' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface GDPRExportRequest {
  orgId: string;
  userId: string;
  scope: 'user' | 'org';
}

export interface GDPRExportResult {
  success: boolean;
  exportToken?: string;
  expiresAt?: string;
  error?: string;
}

export interface GDPRDeleteRequest {
  orgId: string;
  userId: string;
  scope: 'user' | 'org';
  confirm: boolean;
}

export interface GDPRDeleteResult {
  success: boolean;
  jobsDeleted?: number;
  assetsDeleted?: number;
  error?: string;
}

export interface RetentionCleanupResult {
  jobsArchived: number;
  assetsDeleted: number;
  errors: string[];
}

// =========================
// GDPR EXPORT
// =========================

export async function createGDPRExport(
  request: GDPRExportRequest
): Promise<GDPRExportResult> {
  try {
    logger.info({ request }, 'Creating GDPR export');

    if (!request.confirm) {
      return {
        success: false,
        error: 'Export confirmation required'
      };
    }

    // Generate export token
    const exportToken = nanoid(32);
    const expiresAt = new Date(Date.now() + 
      parseInt(process.env.GDPR_EXPORT_TTL_MIN || '30') * 60 * 1000
    );

    // Create export record
    const { error: exportError } = await supabase
      .from('gdpr_exports')
      .insert({
        org_id: request.orgId,
        user_id: request.userId,
        export_token: exportToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });

    if (exportError) {
      logger.error({ error: exportError.message }, 'Failed to create export record');
      return {
        success: false,
        error: 'Failed to create export'
      };
    }

    // Queue export processing
    await processGDPRExport(exportToken, request);

    return {
      success: true,
      exportToken,
      expiresAt: expiresAt.toISOString()
    };

  } catch (error) {
    logger.error({ error: error.message, request }, 'GDPR export creation failed');
    return {
      success: false,
      error: 'Export creation failed'
    };
  }
}

async function processGDPRExport(
  exportToken: string,
  request: GDPRExportRequest
): Promise<void> {
  try {
    // Get all user/org data
    const data = await gatherUserData(request);

    // Create export package
    const exportUrl = await createExportPackage(exportToken, data);

    // Update export record
    await supabase
      .from('gdpr_exports')
      .update({
        status: 'completed',
        file_url: exportUrl
      })
      .eq('export_token', exportToken);

    logger.info({ exportToken }, 'GDPR export completed');

  } catch (error) {
    logger.error({ error: error.message, exportToken }, 'GDPR export processing failed');
    
    await supabase
      .from('gdpr_exports')
      .update({
        status: 'failed'
      })
      .eq('export_token', exportToken);
  }
}

async function gatherUserData(request: GDPRExportRequest): Promise<any> {
  const data: any = {
    user: {},
    jobs: [],
    products: [],
    stores: [],
    attribution: [],
    exports: {
      timestamp: new Date().toISOString(),
      scope: request.scope
    }
  };

  // Get user data
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', request.userId)
    .single();

  data.user = userData;

  // Get jobs data
  const { data: jobsData } = await supabase
    .from('veo_jobs')
    .select('*')
    .eq(request.scope === 'user' ? 'user_id' : 'org_id', 
        request.scope === 'user' ? request.userId : request.orgId);

  data.jobs = jobsData || [];

  // Get products data (if org scope)
  if (request.scope === 'org') {
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('org_id', request.orgId);

    data.products = productsData || [];

    const { data: storesData } = await supabase
      .from('stores')
      .select('*')
      .eq('org_id', request.orgId);

    data.stores = storesData || [];
  }

  // Get attribution data
  const { data: attributionData } = await supabase
    .from('attrib_clicks')
    .select('*')
    .eq('org_id', request.orgId);

  data.attribution = attributionData || [];

  return data;
}

async function createExportPackage(exportToken: string, data: any): Promise<string> {
  // This would create a ZIP file with all the data
  // For now, return a placeholder URL
  return `https://exports.example.com/${exportToken}.zip`;
}

// =========================
// GDPR DELETE
// =========================

export async function createGDPRDelete(
  request: GDPRDeleteRequest
): Promise<GDPRDeleteResult> {
  try {
    logger.info({ request }, 'Creating GDPR deletion');

    if (!request.confirm) {
      return {
        success: false,
        error: 'Deletion confirmation required'
      };
    }

    // Create deletion record
    const { data: deletionData, error: deletionError } = await supabase
      .from('gdpr_deletions')
      .insert({
        org_id: request.orgId,
        user_id: request.userId,
        scope: request.scope,
        status: 'pending'
      })
      .select()
      .single();

    if (deletionError) {
      logger.error({ error: deletionError.message }, 'Failed to create deletion record');
      return {
        success: false,
        error: 'Failed to create deletion'
      };
    }

    // Queue deletion processing
    await processGDPRDelete(deletionData.id, request);

    return {
      success: true
    };

  } catch (error) {
    logger.error({ error: error.message, request }, 'GDPR deletion creation failed');
    return {
      success: false,
      error: 'Deletion creation failed'
    };
  }
}

async function processGDPRDelete(
  deletionId: string,
  request: GDPRDeleteRequest
): Promise<void> {
  try {
    let jobsDeleted = 0;
    let assetsDeleted = 0;

    // Update status to processing
    await supabase
      .from('gdpr_deletions')
      .update({ status: 'processing' })
      .eq('id', deletionId);

    // Delete jobs and assets
    if (request.scope === 'user') {
      const result = await deleteUserData(request.userId);
      jobsDeleted = result.jobsDeleted;
      assetsDeleted = result.assetsDeleted;
    } else {
      const result = await deleteOrgData(request.orgId);
      jobsDeleted = result.jobsDeleted;
      assetsDeleted = result.assetsDeleted;
    }

    // Update deletion record
    await supabase
      .from('gdpr_deletions')
      .update({
        status: 'completed',
        jobs_deleted: jobsDeleted,
        assets_deleted: assetsDeleted,
        completed_at: new Date().toISOString()
      })
      .eq('id', deletionId);

    logger.info({ 
      deletionId, 
      jobsDeleted, 
      assetsDeleted 
    }, 'GDPR deletion completed');

  } catch (error) {
    logger.error({ error: error.message, deletionId }, 'GDPR deletion processing failed');
    
    await supabase
      .from('gdpr_deletions')
      .update({
        status: 'failed'
      })
      .eq('id', deletionId);
  }
}

async function deleteUserData(userId: string): Promise<{ jobsDeleted: number; assetsDeleted: number }> {
  let jobsDeleted = 0;
  let assetsDeleted = 0;

  // Get user's jobs
  const { data: jobs } = await supabase
    .from('veo_jobs')
    .select('id, output_url')
    .eq('user_id', userId);

  if (jobs) {
    // Delete job assets
    for (const job of jobs) {
      if (job.output_url) {
        try {
          await supabase.storage
            .from('renders')
            .remove([job.output_url]);
          assetsDeleted++;
        } catch (error) {
          logger.warn({ error: error.message, jobId: job.id }, 'Failed to delete job asset');
        }
      }
    }

    // Delete jobs
    const { error: jobsError } = await supabase
      .from('veo_jobs')
      .delete()
      .eq('user_id', userId);

    if (!jobsError) {
      jobsDeleted = jobs.length;
    }
  }

  return { jobsDeleted, assetsDeleted };
}

async function deleteOrgData(orgId: string): Promise<{ jobsDeleted: number; assetsDeleted: number }> {
  let jobsDeleted = 0;
  let assetsDeleted = 0;

  // Get org's jobs
  const { data: jobs } = await supabase
    .from('veo_jobs')
    .select('id, output_url')
    .eq('org_id', orgId);

  if (jobs) {
    // Delete job assets
    for (const job of jobs) {
      if (job.output_url) {
        try {
          await supabase.storage
            .from('renders')
            .remove([job.output_url]);
          assetsDeleted++;
        } catch (error) {
          logger.warn({ error: error.message, jobId: job.id }, 'Failed to delete job asset');
        }
      }
    }

    // Delete jobs
    const { error: jobsError } = await supabase
      .from('veo_jobs')
      .delete()
      .eq('org_id', orgId);

    if (!jobsError) {
      jobsDeleted = jobs.length;
    }
  }

  // Delete other org data
  await supabase
    .from('products')
    .delete()
    .eq('org_id', orgId);

  await supabase
    .from('stores')
    .delete()
    .eq('org_id', orgId);

  await supabase
    .from('attrib_clicks')
    .delete()
    .eq('org_id', orgId);

  await supabase
    .from('attrib_conversions')
    .delete()
    .eq('org_id', orgId);

  return { jobsDeleted, assetsDeleted };
}

// =========================
// RETENTION CLEANUP
// =========================

export async function performRetentionCleanup(): Promise<RetentionCleanupResult> {
  try {
    logger.info('Starting retention cleanup');

    const ttlDays = parseInt(process.env.JOB_TTL_DAYS || '90');
    const cutoffDate = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000);

    let jobsArchived = 0;
    let assetsDeleted = 0;
    const errors: string[] = [];

    // Find old jobs to archive
    const { data: oldJobs, error: jobsError } = await supabase
      .from('veo_jobs')
      .select('id, output_url, hls_master_url, sprites_image_url, sprites_vtt_url')
      .lt('created_at', cutoffDate.toISOString())
      .eq('archived', false)
      .is('share_token', null);

    if (jobsError) {
      errors.push(`Failed to query old jobs: ${jobsError.message}`);
      return { jobsArchived: 0, assetsDeleted: 0, errors };
    }

    if (oldJobs) {
      // Delete assets for old jobs
      for (const job of oldJobs) {
        try {
          const assetsToDelete = [
            job.output_url,
            job.hls_master_url,
            job.sprites_image_url,
            job.sprites_vtt_url
          ].filter(Boolean);

          if (assetsToDelete.length > 0) {
            await supabase.storage
              .from('renders')
              .remove(assetsToDelete);
            assetsDeleted += assetsToDelete.length;
          }
        } catch (error) {
          errors.push(`Failed to delete assets for job ${job.id}: ${error.message}`);
        }
      }

      // Archive jobs
      const { error: archiveError } = await supabase
        .from('veo_jobs')
        .update({
          archived: true,
          archived_at: new Date().toISOString()
        })
        .lt('created_at', cutoffDate.toISOString())
        .eq('archived', false)
        .is('share_token', null);

      if (archiveError) {
        errors.push(`Failed to archive jobs: ${archiveError.message}`);
      } else {
        jobsArchived = oldJobs.length;
      }
    }

    // Clean up expired GDPR exports
    try {
      await supabase
        .from('gdpr_exports')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .eq('status', 'completed');
    } catch (error) {
      errors.push(`Failed to clean up expired exports: ${error.message}`);
    }

    logger.info({ 
      jobsArchived, 
      assetsDeleted, 
      errors: errors.length 
    }, 'Retention cleanup completed');

    return {
      jobsArchived,
      assetsDeleted,
      errors
    };

  } catch (error) {
    logger.error({ error: error.message }, 'Retention cleanup failed');
    return {
      jobsArchived: 0,
      assetsDeleted: 0,
      errors: [error.message]
    };
  }
}

// =========================
// EXPORT ACCESS
// =========================

export async function getGDPRExport(exportToken: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const { data: exportData, error } = await supabase
      .from('gdpr_exports')
      .select('*')
      .eq('export_token', exportToken)
      .single();

    if (error || !exportData) {
      return {
        success: false,
        error: 'Export not found'
      };
    }

    if (exportData.status !== 'completed') {
      return {
        success: false,
        error: 'Export not ready'
      };
    }

    if (new Date(exportData.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Export expired'
      };
    }

    return {
      success: true,
      data: exportData
    };

  } catch (error) {
    logger.error({ error: error.message, exportToken }, 'Failed to get GDPR export');
    return {
      success: false,
      error: 'Failed to get export'
    };
  }
}

