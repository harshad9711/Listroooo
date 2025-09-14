import { Worker } from 'bullmq';
import { redis } from '../lib/queue.js';
import pino from 'pino';

const logger = pino({ name: 'workers' });

// =========================
// WORKER CONFIGURATION
// =========================

const workerConfig = {
  connection: redis,
  concurrency: parseInt(process.env.RENDERS_CONCURRENCY || '2'),
  removeOnComplete: 100,
  removeOnFail: 50,
};

// =========================
// VIDEO GENERATION WORKER
// =========================

const videoWorker = new Worker('video-generation', async (job) => {
  const { type, data } = job;
  
  logger.info({ jobId: job.id, type, data }, 'Processing video generation job');

  try {
    switch (type) {
      case 'generate-video':
        return await processVideoGeneration(data);
      case 'process-variation-batch':
        return await processVariationBatch(data);
      case 'generate-thumbnail':
        return await processThumbnailGeneration(data);
      case 'burn-captions':
        return await processCaptionBurning(data);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  } catch (error) {
    logger.error({ jobId: job.id, type, error: error.message }, 'Video generation job failed');
    throw error;
  }
}, workerConfig);

// =========================
// WEBHOOK WORKER
// =========================

const webhookWorker = new Worker('webhook-delivery', async (job) => {
  const { type, data } = job;
  
  logger.info({ jobId: job.id, type, data }, 'Processing webhook job');

  try {
    switch (type) {
      case 'deliver-webhook':
        return await processWebhookDelivery(data);
      case 'retry-webhook':
        return await processWebhookRetry(data);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  } catch (error) {
    logger.error({ jobId: job.id, type, error: error.message }, 'Webhook job failed');
    throw error;
  }
}, workerConfig);

// =========================
// BILLING WORKER
// =========================

const billingWorker = new Worker('billing', async (job) => {
  const { type, data } = job;
  
  logger.info({ jobId: job.id, type, data }, 'Processing billing job');

  try {
    switch (type) {
      case 'process-usage':
        return await processUsage(data);
      case 'create-invoice':
        return await processInvoiceCreation(data);
      case 'sync-stripe':
        return await processStripeSync(data);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  } catch (error) {
    logger.error({ jobId: job.id, type, error: error.message }, 'Billing job failed');
    throw error;
  }
}, workerConfig);

// =========================
// CDN CLEANUP WORKER
// =========================

const cdnWorker = new Worker('cdn-cleanup', async (job) => {
  const { type, data } = job;
  
  logger.info({ jobId: job.id, type, data }, 'Processing CDN cleanup job');

  try {
    switch (type) {
      case 'upload-to-cdn':
        return await processCDNUpload(data);
      case 'cleanup-expired-assets':
        return await processAssetCleanup(data);
      case 'generate-signed-url':
        return await processSignedURLGeneration(data);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  } catch (error) {
    logger.error({ jobId: job.id, type, error: error.message }, 'CDN cleanup job failed');
    throw error;
  }
}, workerConfig);

// =========================
// EMAIL WORKER
// =========================

const emailWorker = new Worker('email-notifications', async (job) => {
  const { type, data } = job;
  
  logger.info({ jobId: job.id, type, data }, 'Processing email job');

  try {
    switch (type) {
      case 'send-email':
        return await processEmailSending(data);
      case 'send-slack-notification':
        return await processSlackNotification(data);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  } catch (error) {
    logger.error({ jobId: job.id, type, error: error.message }, 'Email job failed');
    throw error;
  }
}, workerConfig);

// =========================
// ANALYTICS WORKER
// =========================

const analyticsWorker = new Worker('analytics-processing', async (job) => {
  const { type, data } = job;
  
  logger.info({ jobId: job.id, type, data }, 'Processing analytics job');

  try {
    switch (type) {
      case 'process-analytics':
        return await processAnalytics(data);
      case 'generate-reports':
        return await processReportGeneration(data);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  } catch (error) {
    logger.error({ jobId: job.id, type, error: error.message }, 'Analytics job failed');
    throw error;
  }
}, workerConfig);

// =========================
// JOB PROCESSORS
// =========================

async function processVideoGeneration(data) {
  const { jobId, organizationId, userId, prompt, config } = data;
  
  logger.info({ jobId, organizationId, userId }, 'Processing video generation');

  // Import video generation logic
  const { generateVideo } = await import('../lib/veo3Generator.js');
  
  try {
    // Update job status to processing
    await updateJobStatus(jobId, 'processing');
    
    // Generate video
    const result = await generateVideo(prompt, config);
    
    // Update job status to completed
    await updateJobStatus(jobId, 'completed', result);
    
    // Track usage
    await trackUsage(organizationId, userId, jobId, 'render');
    
    // Upload to CDN
    await queueManager.addJob('cdnCleanup', 'upload-to-cdn', {
      organizationId,
      userId,
      jobId,
      file: result.videoFile,
      contentType: 'video/mp4',
      metadata: { type: 'generated_video' },
    });
    
    return result;
  } catch (error) {
    // Update job status to failed
    await updateJobStatus(jobId, 'failed', { error: error.message });
    throw error;
  }
}

async function processVariationBatch(data) {
  const { batchId, organizationId, userId, templateId, variations } = data;
  
  logger.info({ batchId, organizationId, userId }, 'Processing variation batch');

  // Import variation processing logic
  const { processVariationBatch } = await import('../lib/veo3VariationEngine.js');
  
  try {
    // Update batch status to processing
    await updateVariationBatchStatus(batchId, 'processing');
    
    // Process variations
    const result = await processVariationBatch(templateId, variations);
    
    // Update batch status to completed
    await updateVariationBatchStatus(batchId, 'completed', result);
    
    return result;
  } catch (error) {
    // Update batch status to failed
    await updateVariationBatchStatus(batchId, 'failed', { error: error.message });
    throw error;
  }
}

async function processThumbnailGeneration(data) {
  const { jobId, organizationId, userId, videoUrl } = data;
  
  logger.info({ jobId, organizationId, userId }, 'Processing thumbnail generation');

  // Import thumbnail generation logic
  const { generateThumbnail } = await import('../lib/veo3FFmpeg.js');
  
  try {
    // Generate thumbnail
    const thumbnail = await generateThumbnail(videoUrl);
    
    // Upload to CDN
    await queueManager.addJob('cdnCleanup', 'upload-to-cdn', {
      organizationId,
      userId,
      jobId,
      file: thumbnail,
      contentType: 'image/jpeg',
      metadata: { type: 'thumbnail' },
    });
    
    return thumbnail;
  } catch (error) {
    logger.error({ jobId, error: error.message }, 'Thumbnail generation failed');
    throw error;
  }
}

async function processCaptionBurning(data) {
  const { jobId, organizationId, userId, videoUrl, captions } = data;
  
  logger.info({ jobId, organizationId, userId }, 'Processing caption burning');

  // Import caption burning logic
  const { burnCaptionsIntoVideo } = await import('../lib/veo3FFmpeg.js');
  
  try {
    // Burn captions into video
    const result = await burnCaptionsIntoVideo(videoUrl, captions);
    
    // Upload to CDN
    await queueManager.addJob('cdnCleanup', 'upload-to-cdn', {
      organizationId,
      userId,
      jobId,
      file: result,
      contentType: 'video/mp4',
      metadata: { type: 'video_with_captions' },
    });
    
    return result;
  } catch (error) {
    logger.error({ jobId, error: error.message }, 'Caption burning failed');
    throw error;
  }
}

async function processWebhookDelivery(data) {
  const { webhookEndpointId, eventType, payload, organizationId } = data;
  
  logger.info({ webhookEndpointId, eventType, organizationId }, 'Processing webhook delivery');

  // Import webhook delivery logic
  const { processWebhookDelivery } = await import('../lib/webhooks.js');
  
  try {
    const result = await processWebhookDelivery(webhookEndpointId, eventType, payload);
    return result;
  } catch (error) {
    logger.error({ webhookEndpointId, error: error.message }, 'Webhook delivery failed');
    throw error;
  }
}

async function processWebhookRetry(data) {
  const { deliveryId } = data;
  
  logger.info({ deliveryId }, 'Processing webhook retry');

  // Import webhook retry logic
  const { processWebhookRetry } = await import('../lib/webhooks.js');
  
  try {
    const result = await processWebhookRetry(deliveryId);
    return result;
  } catch (error) {
    logger.error({ deliveryId, error: error.message }, 'Webhook retry failed');
    throw error;
  }
}

async function processUsage(data) {
  const { organizationId, usageRecordId, totalCents } = data;
  
  logger.info({ organizationId, usageRecordId, totalCents }, 'Processing usage');

  // Import billing logic
  const { createInvoice } = await import('../lib/billing.js');
  
  try {
    // Get usage record
    const { data: usageRecord, error } = await supabase
      .from('veo_usage_records')
      .select('*')
      .eq('id', usageRecordId)
      .single();

    if (error) {
      throw new Error(`Usage record not found: ${error.message}`);
    }

    // Create invoice if needed
    if (totalCents > 0) {
      await createInvoice(organizationId, [usageRecord]);
    }
    
    return { success: true };
  } catch (error) {
    logger.error({ organizationId, usageRecordId, error: error.message }, 'Usage processing failed');
    throw error;
  }
}

async function processInvoiceCreation(data) {
  const { organizationId, usageRecords } = data;
  
  logger.info({ organizationId, usageRecordCount: usageRecords.length }, 'Processing invoice creation');

  // Import billing logic
  const { createInvoice } = await import('../lib/billing.js');
  
  try {
    const result = await createInvoice(organizationId, usageRecords);
    return result;
  } catch (error) {
    logger.error({ organizationId, error: error.message }, 'Invoice creation failed');
    throw error;
  }
}

async function processStripeSync(data) {
  const { organizationId } = data;
  
  logger.info({ organizationId }, 'Processing Stripe sync');

  // Import billing logic
  const { syncStripeData } = await import('../lib/billing.js');
  
  try {
    const result = await syncStripeData(organizationId);
    return result;
  } catch (error) {
    logger.error({ organizationId, error: error.message }, 'Stripe sync failed');
    throw error;
  }
}

async function processCDNUpload(data) {
  const { organizationId, userId, jobId, file, contentType, metadata } = data;
  
  logger.info({ organizationId, userId, jobId }, 'Processing CDN upload');

  // Import CDN logic
  const { uploadToCDN } = await import('../lib/cdn.js');
  
  try {
    const result = await uploadToCDN(organizationId, userId, {
      file,
      jobId,
      contentType,
      metadata,
    });
    return result;
  } catch (error) {
    logger.error({ organizationId, userId, jobId, error: error.message }, 'CDN upload failed');
    throw error;
  }
}

async function processAssetCleanup(data) {
  const { assetId, organizationId, s3Key, s3Bucket } = data;
  
  logger.info({ assetId, organizationId, s3Key }, 'Processing asset cleanup');

  // Import CDN logic
  const { processAssetCleanup } = await import('../lib/cdn.js');
  
  try {
    const result = await processAssetCleanup(assetId, organizationId, s3Key, s3Bucket);
    return result;
  } catch (error) {
    logger.error({ assetId, organizationId, s3Key, error: error.message }, 'Asset cleanup failed');
    throw error;
  }
}

async function processSignedURLGeneration(data) {
  const { organizationId, assetId, expiresIn } = data;
  
  logger.info({ organizationId, assetId, expiresIn }, 'Processing signed URL generation');

  // Import CDN logic
  const { generateSignedURL } = await import('../lib/cdn.js');
  
  try {
    const result = await generateSignedURL(organizationId, assetId, expiresIn);
    return result;
  } catch (error) {
    logger.error({ organizationId, assetId, error: error.message }, 'Signed URL generation failed');
    throw error;
  }
}

async function processEmailSending(data) {
  const { to, subject, template, data: emailData } = data;
  
  logger.info({ to, subject }, 'Processing email sending');

  // Import email logic
  const { sendEmail } = await import('../lib/email.js');
  
  try {
    const result = await sendEmail(to, subject, template, emailData);
    return result;
  } catch (error) {
    logger.error({ to, subject, error: error.message }, 'Email sending failed');
    throw error;
  }
}

async function processSlackNotification(data) {
  const { channel, message, attachments } = data;
  
  logger.info({ channel }, 'Processing Slack notification');

  // Import Slack logic
  const { sendSlackMessage } = await import('../lib/slack.js');
  
  try {
    const result = await sendSlackMessage(channel, message, attachments);
    return result;
  } catch (error) {
    logger.error({ channel, error: error.message }, 'Slack notification failed');
    throw error;
  }
}

async function processAnalytics(data) {
  const { organizationId, eventType, eventData } = data;
  
  logger.info({ organizationId, eventType }, 'Processing analytics');

  // Import analytics logic
  const { processAnalyticsEvent } = await import('../lib/analytics.js');
  
  try {
    const result = await processAnalyticsEvent(organizationId, eventType, eventData);
    return result;
  } catch (error) {
    logger.error({ organizationId, eventType, error: error.message }, 'Analytics processing failed');
    throw error;
  }
}

async function processReportGeneration(data) {
  const { organizationId, reportType, dateRange } = data;
  
  logger.info({ organizationId, reportType }, 'Processing report generation');

  // Import analytics logic
  const { generateReport } = await import('../lib/analytics.js');
  
  try {
    const result = await generateReport(organizationId, reportType, dateRange);
    return result;
  } catch (error) {
    logger.error({ organizationId, reportType, error: error.message }, 'Report generation failed');
    throw error;
  }
}

// =========================
// HELPER FUNCTIONS
// =========================

async function updateJobStatus(jobId, status, result = null) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const updateData = { status };
  if (result) {
    updateData.result = result;
  }

  await supabase
    .from('veo_jobs')
    .update(updateData)
    .eq('id', jobId);
}

async function updateVariationBatchStatus(batchId, status, result = null) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const updateData = { status };
  if (result) {
    updateData.result = result;
  }

  await supabase
    .from('veo_variations')
    .update(updateData)
    .eq('id', batchId);
}

async function trackUsage(organizationId, userId, jobId, resourceType) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { trackUsage } = await import('../lib/billing.js');
  await trackUsage(organizationId, userId, jobId, resourceType);
}

// =========================
// WORKER EVENT HANDLERS
// =========================

videoWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Video generation job completed');
});

videoWorker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, error: err.message }, 'Video generation job failed');
});

webhookWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Webhook job completed');
});

webhookWorker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, error: err.message }, 'Webhook job failed');
});

billingWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Billing job completed');
});

billingWorker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, error: err.message }, 'Billing job failed');
});

cdnWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'CDN cleanup job completed');
});

cdnWorker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, error: err.message }, 'CDN cleanup job failed');
});

emailWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Email job completed');
});

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, error: err.message }, 'Email job failed');
});

analyticsWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Analytics job completed');
});

analyticsWorker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, error: err.message }, 'Analytics job failed');
});

// =========================
// GRACEFUL SHUTDOWN
// =========================

process.on('SIGINT', async () => {
  logger.info('Shutting down workers...');
  
  await Promise.all([
    videoWorker.close(),
    webhookWorker.close(),
    billingWorker.close(),
    cdnWorker.close(),
    emailWorker.close(),
    analyticsWorker.close(),
  ]);
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down workers...');
  
  await Promise.all([
    videoWorker.close(),
    webhookWorker.close(),
    billingWorker.close(),
    cdnWorker.close(),
    emailWorker.close(),
    analyticsWorker.close(),
  ]);
  
  process.exit(0);
});

logger.info('Workers started successfully');

