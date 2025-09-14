import { createClient } from '@supabase/supabase-js';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import Filter from 'bad-words';
import pino from 'pino';

const logger = pino({ name: 'moderation' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Google Cloud Vision (if enabled)
let visionClient: ImageAnnotatorClient | null = null;
if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
  visionClient = new ImageAnnotatorClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.GOOGLE_CLOUD_CREDENTIALS_PATH
  });
}

// Initialize profanity filter
const profanityFilter = new Filter();

// =========================
// TYPES
// =========================

export interface ModerationResult {
  id: string;
  veo_job_id: string;
  org_id: string;
  content_type: 'video' | 'thumbnail' | 'caption' | 'prompt';
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  confidence_score?: number;
  categories: Record<string, any>;
  details: Record<string, any>;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface ModerationRequest {
  veoJobId: string;
  orgId: string;
  contentType: 'video' | 'thumbnail' | 'caption' | 'prompt';
  content: string | Buffer;
  metadata?: Record<string, any>;
}

// =========================
// MODERATION ENGINES
// =========================

export class TextModerator {
  static async moderateText(text: string): Promise<{
    status: 'approved' | 'rejected' | 'flagged';
    confidence: number;
    categories: Record<string, any>;
    details: Record<string, any>;
  }> {
    const results = {
      status: 'approved' as const,
      confidence: 1.0,
      categories: {} as Record<string, any>,
      details: {} as Record<string, any>
    };

    // Check for profanity
    if (profanityFilter.isProfane(text)) {
      results.status = 'rejected';
      results.confidence = 0.9;
      results.categories.profanity = true;
      results.details.profanity = 'Profanity detected';
    }

    // Check for spam patterns
    const spamPatterns = [
      /(.)\1{4,}/g, // Repeated characters
      /(https?:\/\/[^\s]+)/g, // URLs
      /@\w+/g, // Mentions
      /#\w+/g, // Hashtags
      /[A-Z]{5,}/g // Excessive caps
    ];

    let spamScore = 0;
    for (const pattern of spamPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        spamScore += matches.length;
      }
    }

    if (spamScore > 5) {
      results.status = 'flagged';
      results.confidence = 0.7;
      results.categories.spam = true;
      results.details.spam = `Spam score: ${spamScore}`;
    }

    // Check for inappropriate content
    const inappropriateKeywords = [
      'violence', 'hate', 'discrimination', 'harassment',
      'explicit', 'adult', 'nsfw', 'inappropriate'
    ];

    const lowerText = text.toLowerCase();
    for (const keyword of inappropriateKeywords) {
      if (lowerText.includes(keyword)) {
        results.status = 'flagged';
        results.confidence = 0.6;
        results.categories.inappropriate = true;
        results.details.inappropriate = `Keyword detected: ${keyword}`;
        break;
      }
    }

    return results;
  }
}

export class ImageModerator {
  static async moderateImage(imageBuffer: Buffer): Promise<{
    status: 'approved' | 'rejected' | 'flagged';
    confidence: number;
    categories: Record<string, any>;
    details: Record<string, any>;
  }> {
    const results = {
      status: 'approved' as const,
      confidence: 1.0,
      categories: {} as Record<string, any>,
      details: {} as Record<string, any>
    };

    if (!visionClient) {
      logger.warn('Google Cloud Vision not configured, skipping image moderation');
      return results;
    }

    try {
      // Use Google Cloud Vision API for content moderation
      const [result] = await visionClient.safeSearchDetection(imageBuffer);
      const safeSearch = result.safeSearchAnnotation;

      if (safeSearch) {
        const likelihoods = {
          adult: safeSearch.adult,
          violence: safeSearch.violence,
          racy: safeSearch.racy,
          medical: safeSearch.medical,
          spoof: safeSearch.spoof
        };

        // Check for inappropriate content
        for (const [category, likelihood] of Object.entries(likelihoods)) {
          if (likelihood === 'VERY_LIKELY' || likelihood === 'LIKELY') {
            results.status = 'rejected';
            results.confidence = 0.9;
            results.categories[category] = true;
            results.details[category] = `High likelihood of ${category} content`;
          } else if (likelihood === 'POSSIBLE') {
            results.status = 'flagged';
            results.confidence = 0.6;
            results.categories[category] = true;
            results.details[category] = `Possible ${category} content`;
          }
        }
      }

      // Use Google Cloud Vision API for label detection
      const [labelResult] = await visionClient.labelDetection(imageBuffer);
      const labels = labelResult.labelAnnotations;

      if (labels) {
        const inappropriateLabels = [
          'Violence', 'Weapon', 'Adult', 'Explicit', 'Inappropriate',
          'Hate', 'Discrimination', 'Harassment'
        ];

        for (const label of labels) {
          if (inappropriateLabels.includes(label.description)) {
            results.status = 'flagged';
            results.confidence = Math.max(results.confidence, label.score || 0.5);
            results.categories.inappropriate = true;
            results.details.inappropriate = `Inappropriate label: ${label.description}`;
          }
        }
      }

    } catch (error) {
      logger.error({ error: error.message }, 'Image moderation failed');
      results.status = 'flagged';
      results.confidence = 0.5;
      results.categories.error = true;
      results.details.error = 'Moderation service error';
    }

    return results;
  }
}

export class VideoModerator {
  static async moderateVideo(videoUrl: string): Promise<{
    status: 'approved' | 'rejected' | 'flagged';
    confidence: number;
    categories: Record<string, any>;
    details: Record<string, any>;
  }> {
    const results = {
      status: 'approved' as const,
      confidence: 1.0,
      categories: {} as Record<string, any>,
      details: {} as Record<string, any>
    };

    try {
      // Extract thumbnail from video for moderation
      const thumbnailBuffer = await extractVideoThumbnail(videoUrl);
      
      // Moderate the thumbnail
      const imageResults = await ImageModerator.moderateImage(thumbnailBuffer);
      
      if (imageResults.status !== 'approved') {
        results.status = imageResults.status;
        results.confidence = imageResults.confidence;
        results.categories = imageResults.categories;
        results.details = imageResults.details;
      }

      // Additional video-specific checks could be added here
      // For example, checking video duration, resolution, etc.

    } catch (error) {
      logger.error({ error: error.message }, 'Video moderation failed');
      results.status = 'flagged';
      results.confidence = 0.5;
      results.categories.error = true;
      results.details.error = 'Video moderation service error';
    }

    return results;
  }
}

// =========================
// MODERATION ORCHESTRATOR
// =========================

export async function moderateContent(request: ModerationRequest): Promise<ModerationResult> {
  try {
    const { veoJobId, orgId, contentType, content, metadata = {} } = request;

    logger.info({ veoJobId, orgId, contentType }, 'Starting content moderation');

    let moderationResults;

    // Route to appropriate moderator based on content type
    switch (contentType) {
      case 'prompt':
      case 'caption':
        moderationResults = await TextModerator.moderateText(content as string);
        break;
      case 'thumbnail':
        moderationResults = await ImageModerator.moderateImage(content as Buffer);
        break;
      case 'video':
        moderationResults = await VideoModerator.moderateVideo(content as string);
        break;
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }

    // Save moderation result to database
    const { data, error } = await supabase
      .from('veo_moderation_results')
      .insert({
        veo_job_id: veoJobId,
        org_id: orgId,
        content_type: contentType,
        status: moderationResults.status,
        confidence_score: moderationResults.confidence,
        categories: moderationResults.categories,
        details: moderationResults.details,
        metadata
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save moderation result: ${error.message}`);
    }

    // Update veo_jobs moderation status
    await supabase
      .from('veo_jobs')
      .update({ 
        moderation_status: moderationResults.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', veoJobId);

    logger.info({ 
      veoJobId, 
      contentType, 
      status: moderationResults.status,
      confidence: moderationResults.confidence 
    }, 'Content moderation completed');

    return data;
  } catch (error) {
    logger.error({ error: error.message }, 'Content moderation failed');
    throw error;
  }
}

// =========================
// MODERATION MANAGEMENT
// =========================

export async function getModerationResults(orgId: string, status?: string): Promise<ModerationResult[]> {
  try {
    let query = supabase
      .from('veo_moderation_results')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get moderation results: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get moderation results');
    throw error;
  }
}

export async function updateModerationResult(
  resultId: string,
  status: 'approved' | 'rejected' | 'flagged',
  reviewedBy: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('veo_moderation_results')
      .update({
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', resultId);

    if (error) {
      throw new Error(`Failed to update moderation result: ${error.message}`);
    }

    logger.info({ resultId, status, reviewedBy }, 'Moderation result updated');
  } catch (error) {
    logger.error({ resultId, error: error.message }, 'Failed to update moderation result');
    throw error;
  }
}

// =========================
// HELPER FUNCTIONS
// =========================

async function extractVideoThumbnail(videoUrl: string): Promise<Buffer> {
  // This is a simplified implementation
  // In production, you would use FFmpeg to extract a thumbnail
  // For now, we'll return a placeholder buffer
  
  const ffmpeg = require('fluent-ffmpeg');
  const path = require('path');
  const fs = require('fs');
  
  return new Promise((resolve, reject) => {
    const outputPath = path.join('/tmp', `thumbnail_${Date.now()}.jpg`);
    
    ffmpeg(videoUrl)
      .screenshots({
        timestamps: ['50%'],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath)
      })
      .on('end', () => {
        const buffer = fs.readFileSync(outputPath);
        fs.unlinkSync(outputPath); // Clean up
        resolve(buffer);
      })
      .on('error', reject);
  });
}

// =========================
// EXPORTS
// =========================

export { TextModerator, ImageModerator, VideoModerator };

