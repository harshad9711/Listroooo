/**
 * Job Cancellation API
 * Handles job cancellation and resume on restart functionality
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '../middleware/auth.js';
import { veoPollQ } from '../queues/veo.js';

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Apply authentication to all routes
router.use(authenticateUser);

/**
 * POST /api/veo3/jobs/:id/cancel
 * Cancel a running or queued job
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const userId = req.user.id;

    // Update job as cancelled with conditional status preservation
    // Using a two-step approach: first check status, then update
    const { data: currentJob, error: fetchError } = await supabase
      .from('veo_jobs')
      .select('status, cancelled')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !currentJob) {
      return res.status(404).json({ 
        success: false,
        error: 'Job not found' 
      });
    }

    // If already cancelled, return success
    if (currentJob.cancelled) {
      return res.json({ ok: true });
    }

    // Update job as cancelled, preserving 'done' status if already completed
    const { error: updateError } = await supabase
      .from('veo_jobs')
      .update({
        cancelled: true,
        cancel_reason: reason || 'user_cancel',
        status: currentJob.status === 'done' ? 'done' : currentJob.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error cancelling job:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to cancel job' 
      });
    }

    // TODO: Enqueue graceful cancellation message to workers
    // This would be implemented with BullMQ or similar queue system

    res.json({ ok: true });

  } catch (error) {
    console.error('Job cancellation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to cancel job' 
    });
  }
});

/**
 * GET /api/veo3/jobs/:id/cancel-status
 * Get cancellation status of a job
 */
router.get('/:id/cancel-status', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: job, error } = await supabase
      .from('veo_jobs')
      .select('id, status, cancelled, cancel_reason, updated_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !job) {
      return res.status(404).json({ 
        success: false,
        error: 'Job not found' 
      });
    }

    res.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        cancelled: job.cancelled,
        cancelReason: job.cancel_reason,
        updatedAt: job.updated_at
      }
    });

  } catch (error) {
    console.error('Cancel status error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get cancel status' 
    });
  }
});

/**
 * POST /api/veo3/jobs/resume
 * Resume all cancelled jobs (admin only)
 */
router.post('/resume', async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: Add admin role check here
    // For now, allow any authenticated user

    // Find all jobs that should be resumed
    const { data: jobs, error: jobsError } = await supabase
      .from('veo_jobs')
      .select('id')
      .in('status', ['queued', 'running'])
      .eq('cancelled', false);

    if (jobsError) {
      console.error('Error finding jobs to resume:', jobsError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to find jobs to resume' 
      });
    }

    // Re-enqueue jobs to workers using BullMQ
    const resumePromises = jobs.map(job => 
      veoPollQ.add('resume', { jobId: job.id }, { removeOnComplete: true })
    );

    await Promise.all(resumePromises);

    res.json({
      success: true,
      message: `Resumed ${jobs?.length || 0} jobs`,
      jobCount: jobs?.length || 0
    });

  } catch (error) {
    console.error('Job resume error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to resume jobs' 
    });
  }
});

export default router;
