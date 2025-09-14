import { createClient } from '@supabase/supabase-js';
import { getOAuthConnection, OAuthProvider } from './oauth.js';
import { veoStartQ, veoPollQ, veoPostQ } from '../queues/veo.js';
import pino from 'pino';

const logger = pino({ name: 'publishing' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface PublishJob {
  id: string;
  veo_job_id: string;
  org_id: string;
  provider: OAuthProvider;
  status: 'queued' | 'uploading' | 'processing' | 'published' | 'error' | 'cancelled';
  scheduled_at?: string;
  external_post_id?: string;
  error_message?: string;
  metadata: Record<string, any>;
}

export interface PublishRequest {
  veoJobId: string;
  orgId: string;
  provider: OAuthProvider;
  scheduledAt?: string;
  caption?: string;
  hashtags?: string[];
  metadata?: Record<string, any>;
}

// =========================
// PUBLISH JOB MANAGEMENT
// =========================

export async function createPublishJob(request: PublishRequest): Promise<string> {
  try {
    const { veoJobId, orgId, provider, scheduledAt, caption, hashtags, metadata = {} } = request;

    // Verify OAuth connection exists
    await getOAuthConnection(orgId, provider);

    // Create publish job
    const { data, error } = await supabase
      .from('publish_jobs')
      .insert({
        veo_job_id: veoJobId,
        org_id: orgId,
        provider: provider,
        status: 'queued',
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        metadata: {
          caption,
          hashtags,
          ...metadata
        }
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create publish job: ${error.message}`);
    }

    // Queue the publish job
    await queuePublishJob(data.id, provider);

    logger.info({ publishJobId: data.id, veoJobId, orgId, provider }, 'Publish job created');
    return data.id;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create publish job');
    throw error;
  }
}

export async function getPublishJobs(orgId: string, status?: string): Promise<PublishJob[]> {
  try {
    let query = supabase
      .from('publish_jobs')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get publish jobs: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get publish jobs');
    throw error;
  }
}

export async function getPublishJob(publishJobId: string): Promise<PublishJob> {
  try {
    const { data, error } = await supabase
      .from('publish_jobs')
      .select('*')
      .eq('id', publishJobId)
      .single();

    if (error) {
      throw new Error(`Publish job not found: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error({ publishJobId, error: error.message }, 'Failed to get publish job');
    throw error;
  }
}

export async function cancelPublishJob(publishJobId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('publish_jobs')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', publishJobId);

    if (error) {
      throw new Error(`Failed to cancel publish job: ${error.message}`);
    }

    logger.info({ publishJobId }, 'Publish job cancelled');
  } catch (error) {
    logger.error({ publishJobId, error: error.message }, 'Failed to cancel publish job');
    throw error;
  }
}

// =========================
// QUEUE MANAGEMENT
// =========================

async function queuePublishJob(publishJobId: string, provider: OAuthProvider): Promise<void> {
  try {
    // Add to appropriate queue based on provider
    switch (provider) {
      case 'tiktok':
        await veoStartQ.add('publish_tiktok', { publishJobId }, { delay: 0 });
        break;
      case 'meta':
        await veoStartQ.add('publish_meta', { publishJobId }, { delay: 0 });
        break;
      case 'youtube':
        await veoStartQ.add('publish_youtube', { publishJobId }, { delay: 0 });
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    logger.info({ publishJobId, provider }, 'Publish job queued');
  } catch (error) {
    logger.error({ publishJobId, provider, error: error.message }, 'Failed to queue publish job');
    throw error;
  }
}

// =========================
// PLATFORM-SPECIFIC PUBLISHERS
// =========================

export async function publishToTikTok(publishJobId: string): Promise<void> {
  try {
    const publishJob = await getPublishJob(publishJobId);
    const connection = await getOAuthConnection(publishJob.org_id, 'tiktok');
    
    // Update status to uploading
    await updatePublishJobStatus(publishJobId, 'uploading');

    // Get video file
    const { data: veoJob } = await supabase
      .from('veo_jobs')
      .select('result')
      .eq('id', publishJob.veo_job_id)
      .single();

    if (!veoJob?.result?.video_url) {
      throw new Error('Video URL not found');
    }

    // Upload to TikTok
    const externalPostId = await uploadToTikTok(
      connection.access_token,
      veoJob.result.video_url,
      publishJob.metadata
    );

    // Update with external post ID
    await supabase
      .from('publish_jobs')
      .update({
        external_post_id: externalPostId,
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', publishJobId);

    logger.info({ publishJobId, externalPostId }, 'Successfully published to TikTok');
  } catch (error) {
    await updatePublishJobStatus(publishJobId, 'error', error.message);
    logger.error({ publishJobId, error: error.message }, 'Failed to publish to TikTok');
    throw error;
  }
}

export async function publishToMeta(publishJobId: string): Promise<void> {
  try {
    const publishJob = await getPublishJob(publishJobId);
    const connection = await getOAuthConnection(publishJob.org_id, 'meta');
    
    // Update status to uploading
    await updatePublishJobStatus(publishJobId, 'uploading');

    // Get video file
    const { data: veoJob } = await supabase
      .from('veo_jobs')
      .select('result')
      .eq('id', publishJob.veo_job_id)
      .single();

    if (!veoJob?.result?.video_url) {
      throw new Error('Video URL not found');
    }

    // Upload to Meta (Facebook/Instagram)
    const externalPostId = await uploadToMeta(
      connection.access_token,
      veoJob.result.video_url,
      publishJob.metadata
    );

    // Update with external post ID
    await supabase
      .from('publish_jobs')
      .update({
        external_post_id: externalPostId,
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', publishJobId);

    logger.info({ publishJobId, externalPostId }, 'Successfully published to Meta');
  } catch (error) {
    await updatePublishJobStatus(publishJobId, 'error', error.message);
    logger.error({ publishJobId, error: error.message }, 'Failed to publish to Meta');
    throw error;
  }
}

export async function publishToYouTube(publishJobId: string): Promise<void> {
  try {
    const publishJob = await getPublishJob(publishJobId);
    const connection = await getOAuthConnection(publishJob.org_id, 'youtube');
    
    // Update status to uploading
    await updatePublishJobStatus(publishJobId, 'uploading');

    // Get video file
    const { data: veoJob } = await supabase
      .from('veo_jobs')
      .select('result')
      .eq('id', publishJob.veo_job_id)
      .single();

    if (!veoJob?.result?.video_url) {
      throw new Error('Video URL not found');
    }

    // Upload to YouTube
    const externalPostId = await uploadToYouTube(
      connection.access_token,
      veoJob.result.video_url,
      publishJob.metadata
    );

    // Update with external post ID
    await supabase
      .from('publish_jobs')
      .update({
        external_post_id: externalPostId,
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', publishJobId);

    logger.info({ publishJobId, externalPostId }, 'Successfully published to YouTube');
  } catch (error) {
    await updatePublishJobStatus(publishJobId, 'error', error.message);
    logger.error({ publishJobId, error: error.message }, 'Failed to publish to YouTube');
    throw error;
  }
}

// =========================
// PLATFORM UPLOAD FUNCTIONS
// =========================

async function uploadToTikTok(accessToken: string, videoUrl: string, metadata: any): Promise<string> {
  // TikTok API implementation
  // This is a simplified version - in production, you'd need to:
  // 1. Download the video file
  // 2. Upload to TikTok's upload endpoint
  // 3. Create the post with metadata
  
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      post_info: {
        title: metadata.caption || 'Generated by Veo 3',
        description: metadata.caption || '',
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TikTok upload failed: ${error}`);
  }

  const data = await response.json();
  return data.data.publish_id;
}

async function uploadToMeta(accessToken: string, videoUrl: string, metadata: any): Promise<string> {
  // Meta API implementation
  // This is a simplified version - in production, you'd need to:
  // 1. Download the video file
  // 2. Upload to Meta's upload endpoint
  // 3. Create the post with metadata
  
  const response = await fetch(`https://graph.facebook.com/v18.0/me/videos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      file_url: videoUrl,
      description: metadata.caption || 'Generated by Veo 3',
      title: metadata.caption || 'Generated by Veo 3'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta upload failed: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

async function uploadToYouTube(accessToken: string, videoUrl: string, metadata: any): Promise<string> {
  // YouTube API implementation
  // This is a simplified version - in production, you'd need to:
  // 1. Download the video file
  // 2. Upload to YouTube's upload endpoint
  // 3. Create the video with metadata
  
  const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      snippet: {
        title: metadata.caption || 'Generated by Veo 3',
        description: metadata.caption || 'Generated by Veo 3',
        tags: metadata.hashtags || []
      },
      status: {
        privacyStatus: 'public'
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube upload failed: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// =========================
// HELPER FUNCTIONS
// =========================

async function updatePublishJobStatus(
  publishJobId: string, 
  status: string, 
  errorMessage?: string
): Promise<void> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  await supabase
    .from('publish_jobs')
    .update(updateData)
    .eq('id', publishJobId);
}

// =========================
// SCHEDULER
// =========================

export async function processScheduledPublishes(): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    // Get jobs scheduled for now or earlier
    const { data: scheduledJobs, error } = await supabase
      .from('publish_jobs')
      .select('*')
      .eq('status', 'queued')
      .lte('scheduled_at', now);

    if (error) {
      throw new Error(`Failed to get scheduled jobs: ${error.message}`);
    }

    if (!scheduledJobs || scheduledJobs.length === 0) {
      logger.info('No scheduled jobs to process');
      return;
    }

    // Queue each scheduled job
    for (const job of scheduledJobs) {
      await queuePublishJob(job.id, job.provider);
    }

    logger.info({ count: scheduledJobs.length }, 'Scheduled jobs queued for processing');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to process scheduled publishes');
    throw error;
  }
}

// =========================
// EXPORTS
// =========================

export { PublishJob, PublishRequest };

