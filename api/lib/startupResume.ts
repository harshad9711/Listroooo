/**
 * Startup Resume Function
 * Automatically resumes jobs on server startup
 */

import { createClient } from '@supabase/supabase-js';
import { veoPollQ } from '../queues/veo.js';
import pino from 'pino';

const logger = pino({ name: 'startup-resume' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Resume all jobs that should be running on startup
 */
export async function resumeJobsOnStartup(): Promise<void> {
  try {
    logger.info('Starting job resume process...');

    // Find all jobs that should be resumed
    const { data: jobs, error } = await supabase
      .from('veo_jobs')
      .select('id, status, cancelled')
      .in('status', ['queued', 'running'])
      .eq('cancelled', false);

    if (error) {
      logger.error({ error: error.message }, 'Failed to fetch jobs for resume');
      return;
    }

    if (!jobs || jobs.length === 0) {
      logger.info('No jobs to resume');
      return;
    }

    logger.info({ jobCount: jobs.length }, 'Found jobs to resume');

    // Re-enqueue jobs to workers
    const resumePromises = jobs.map(job => 
      veoPollQ.add('resume', { jobId: job.id }, { removeOnComplete: true })
    );

    await Promise.all(resumePromises);

    logger.info({ jobCount: jobs.length }, 'Successfully resumed jobs');

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to resume jobs on startup');
  }
}

/**
 * Resume jobs for a specific organization
 */
export async function resumeJobsForOrg(orgId: string): Promise<void> {
  try {
    logger.info({ orgId }, 'Starting job resume process for organization...');

    // Find jobs for specific org
    const { data: jobs, error } = await supabase
      .from('veo_jobs')
      .select('id, status, cancelled')
      .in('status', ['queued', 'running'])
      .eq('cancelled', false)
      .eq('org_id', orgId);

    if (error) {
      logger.error({ orgId, error: error.message }, 'Failed to fetch jobs for org resume');
      return;
    }

    if (!jobs || jobs.length === 0) {
      logger.info({ orgId }, 'No jobs to resume for organization');
      return;
    }

    logger.info({ orgId, jobCount: jobs.length }, 'Found jobs to resume for organization');

    // Re-enqueue jobs to workers
    const resumePromises = jobs.map(job => 
      veoPollQ.add('resume', { jobId: job.id }, { removeOnComplete: true })
    );

    await Promise.all(resumePromises);

    logger.info({ orgId, jobCount: jobs.length }, 'Successfully resumed jobs for organization');

  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to resume jobs for organization');
  }
}

