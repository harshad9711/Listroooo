import AWS from 'aws-sdk';
import { createClient } from '@supabase/supabase-js';
import { queueManager, JOB_TYPES } from './queue.js';
import pino from 'pino';

const logger = pino({ name: 'cdn' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

// Initialize CloudFront
const cloudfront = new AWS.CloudFront({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

// =========================
// CDN ASSET MANAGEMENT
// =========================

export async function uploadToCDN(organizationId, userId, fileData) {
  try {
    const { 
      file, 
      jobId, 
      contentType, 
      metadata = {},
      expiresInDays = parseInt(process.env.ASSET_LIFECYCLE_DAYS || '90')
    } = fileData;

    // Generate unique S3 key
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = getFileExtension(contentType);
    const s3Key = `veo3/${organizationId}/${timestamp}-${randomId}${extension}`;

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: file,
      ContentType: contentType,
      Metadata: {
        organization_id: organizationId,
        user_id: userId,
        job_id: jobId || '',
        uploaded_at: new Date().toISOString(),
        ...metadata,
      },
      ServerSideEncryption: 'AES256',
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    // Generate CloudFront URL
    const cloudfrontUrl = process.env.AWS_CLOUDFRONT_DOMAIN 
      ? `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${s3Key}`
      : uploadResult.Location;

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Store in database
    const { data, error } = await supabase
      .from('veo_cdn_assets')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        job_id: jobId,
        s3_key: s3Key,
        s3_bucket: process.env.AWS_S3_BUCKET,
        cloudfront_url: cloudfrontUrl,
        content_type: contentType,
        content_length: file.length,
        etag: uploadResult.ETag,
        metadata: {
          ...metadata,
          s3_location: uploadResult.Location,
        },
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      // Clean up S3 object if database insert fails
      await s3.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
      }).promise();
      throw new Error(`Failed to store CDN asset: ${error.message}`);
    }

    logger.info({ organizationId, userId, assetId: data.id, s3Key }, 'Asset uploaded to CDN');
    return data;
  } catch (error) {
    logger.error({ organizationId, userId, error: error.message }, 'Failed to upload to CDN');
    throw error;
  }
}

export async function getCDNAsset(organizationId, assetId) {
  try {
    const { data, error } = await supabase
      .from('veo_cdn_assets')
      .select('*')
      .eq('id', assetId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      throw new Error(`CDN asset not found: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error({ organizationId, assetId, error: error.message }, 'Failed to get CDN asset');
    throw error;
  }
}

export async function getCDNAssets(organizationId, userId, filters = {}) {
  try {
    const { jobId, contentType, lifecycleStatus = 'active' } = filters;

    let query = supabase
      .from('veo_cdn_assets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('lifecycle_status', lifecycleStatus)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get CDN assets: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ organizationId, userId, error: error.message }, 'Failed to get CDN assets');
    throw error;
  }
}

export async function generateSignedURL(organizationId, assetId, expiresIn = 3600) {
  try {
    const asset = await getCDNAsset(organizationId, assetId);

    // Generate signed URL for S3
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: asset.s3_bucket,
      Key: asset.s3_key,
      Expires: expiresIn,
    });

    logger.info({ organizationId, assetId, expiresIn }, 'Signed URL generated');
    return {
      url: signedUrl,
      cloudfront_url: asset.cloudfront_url,
      expires_at: new Date(Date.now() + expiresIn * 1000),
    };
  } catch (error) {
    logger.error({ organizationId, assetId, error: error.message }, 'Failed to generate signed URL');
    throw error;
  }
}

export async function deleteCDNAsset(organizationId, assetId) {
  try {
    const asset = await getCDNAsset(organizationId, assetId);

    // Delete from S3
    await s3.deleteObject({
      Bucket: asset.s3_bucket,
      Key: asset.s3_key,
    }).promise();

    // Update database
    const { error } = await supabase
      .from('veo_cdn_assets')
      .update({ lifecycle_status: 'deleted' })
      .eq('id', assetId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to update asset status: ${error.message}`);
    }

    logger.info({ organizationId, assetId, s3Key: asset.s3_key }, 'CDN asset deleted');
    return { success: true };
  } catch (error) {
    logger.error({ organizationId, assetId, error: error.message }, 'Failed to delete CDN asset');
    throw error;
  }
}

// =========================
// LIFECYCLE MANAGEMENT
// =========================

export async function cleanupExpiredAssets() {
  try {
    const now = new Date();
    
    // Get expired assets
    const { data: expiredAssets, error } = await supabase
      .from('veo_cdn_assets')
      .select('*')
      .eq('lifecycle_status', 'active')
      .lt('expires_at', now.toISOString());

    if (error) {
      throw new Error(`Failed to get expired assets: ${error.message}`);
    }

    if (!expiredAssets || expiredAssets.length === 0) {
      logger.info('No expired assets found');
      return;
    }

    // Queue cleanup jobs
    for (const asset of expiredAssets) {
      await queueManager.addJob('cdnCleanup', JOB_TYPES.CLEANUP_EXPIRED_ASSETS, {
        assetId: asset.id,
        organizationId: asset.organization_id,
        s3Key: asset.s3_key,
        s3Bucket: asset.s3_bucket,
      });
    }

    logger.info({ count: expiredAssets.length }, 'Expired assets queued for cleanup');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to cleanup expired assets');
    throw error;
  }
}

export async function processAssetCleanup(assetId, organizationId, s3Key, s3Bucket) {
  try {
    // Delete from S3
    await s3.deleteObject({
      Bucket: s3Bucket,
      Key: s3Key,
    }).promise();

    // Update database
    const { error } = await supabase
      .from('veo_cdn_assets')
      .update({ lifecycle_status: 'deleted' })
      .eq('id', assetId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to update asset status: ${error.message}`);
    }

    logger.info({ assetId, organizationId, s3Key }, 'Asset cleanup completed');
  } catch (error) {
    logger.error({ assetId, organizationId, s3Key, error: error.message }, 'Asset cleanup failed');
    throw error;
  }
}

// =========================
// CLOUDFRONT MANAGEMENT
// =========================

export async function invalidateCache(assetId) {
  try {
    const asset = await getCDNAsset(assetId.organizationId, assetId.assetId);

    if (!process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID) {
      logger.warn('CloudFront distribution ID not configured, skipping cache invalidation');
      return;
    }

    // Create invalidation
    const invalidationParams = {
      DistributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: `veo3-${Date.now()}-${assetId}`,
        Paths: {
          Quantity: 1,
          Items: [`/${asset.s3_key}`],
        },
      },
    };

    const result = await cloudfront.createInvalidation(invalidationParams).promise();

    logger.info({ assetId, invalidationId: result.Invalidation.Id }, 'Cache invalidation created');
    return result;
  } catch (error) {
    logger.error({ assetId, error: error.message }, 'Failed to invalidate cache');
    throw error;
  }
}

// =========================
// STORAGE ANALYTICS
// =========================

export async function getStorageUsage(organizationId) {
  try {
    const { data: assets, error } = await supabase
      .from('veo_cdn_assets')
      .select('content_length, content_type, lifecycle_status')
      .eq('organization_id', organizationId)
      .eq('lifecycle_status', 'active');

    if (error) {
      throw new Error(`Failed to get storage usage: ${error.message}`);
    }

    const totalBytes = assets.reduce((sum, asset) => sum + asset.content_length, 0);
    const totalGB = totalBytes / (1024 * 1024 * 1024);

    // Group by content type
    const byContentType = assets.reduce((acc, asset) => {
      const type = asset.content_type.split('/')[0]; // image, video, etc.
      acc[type] = (acc[type] || 0) + asset.content_length;
      return acc;
    }, {});

    // Convert to GB
    const byContentTypeGB = Object.entries(byContentType).reduce((acc, [type, bytes]) => {
      acc[type] = bytes / (1024 * 1024 * 1024);
      return acc;
    }, {});

    return {
      total_bytes: totalBytes,
      total_gb: totalGB,
      asset_count: assets.length,
      by_content_type: byContentTypeGB,
    };
  } catch (error) {
    logger.error({ organizationId, error: error.message }, 'Failed to get storage usage');
    throw error;
  }
}

// =========================
// HELPER FUNCTIONS
// =========================

function getFileExtension(contentType) {
  const extensions = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/json': '.json',
    'text/plain': '.txt',
  };

  return extensions[contentType] || '.bin';
}

// =========================
// EXPORTS
// =========================

export {
  s3,
  cloudfront,
};

