#!/usr/bin/env node

import pino from 'pino';
import { createClient } from '@supabase/supabase-js';

const logger = pino({ name: 'cdn-cleanup' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanupCDN() {
  try {
    logger.info('Starting CDN cleanup process');

    // Get orphaned files (jobs older than 30 days with no organization)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orphanedJobs, error: jobsError } = await supabase
      .from('veo_jobs')
      .select('id, result')
      .lt('created_at', thirtyDaysAgo.toISOString())
      .is('organization_id', null);

    if (jobsError) {
      throw new Error(`Failed to get orphaned jobs: ${jobsError.message}`);
    }

    if (orphanedJobs && orphanedJobs.length > 0) {
      logger.info({ count: orphanedJobs.length }, 'Found orphaned jobs');
      
      // In production, delete files from S3/CloudFront here
      for (const job of orphanedJobs) {
        if (job.result?.video_url) {
          logger.info({ jobId: job.id, videoUrl: job.result.video_url }, 'Would delete orphaned video');
          // await deleteFromCDN(job.result.video_url);
        }
        if (job.result?.thumbnail_url) {
          logger.info({ jobId: job.id, thumbnailUrl: job.result.thumbnail_url }, 'Would delete orphaned thumbnail');
          // await deleteFromCDN(job.result.thumbnail_url);
        }
      }
    }

    // Get expired shareable links
    const { data: expiredShares, error: sharesError } = await supabase
      .from('veo_shareable_links')
      .select('id, token, expires_at')
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true);

    if (sharesError) {
      throw new Error(`Failed to get expired shares: ${sharesError.message}`);
    }

    if (expiredShares && expiredShares.length > 0) {
      logger.info({ count: expiredShares.length }, 'Found expired shareable links');
      
      // Deactivate expired shares
      const shareIds = expiredShares.map(share => share.id);
      await supabase
        .from('veo_shareable_links')
        .update({ is_active: false })
        .in('id', shareIds);

      logger.info({ count: shareIds.length }, 'Deactivated expired shareable links');
    }

    logger.info('CDN cleanup process completed successfully');
  } catch (error) {
    logger.error({ error: error.message }, 'CDN cleanup process failed');
    throw error;
  }
}

async function main() {
  try {
    await cleanupCDN();
    process.exit(0);
  } catch (error) {
    logger.error({ error: error.message }, 'CDN cleanup failed');
    process.exit(1);
  }
}

main();

