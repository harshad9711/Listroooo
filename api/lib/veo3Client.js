import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { ResilientServiceCalls } from './resilientCall.js';

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key'
);

const VEO_MODEL_ID = process.env.VEO_MODEL_ID || 'veo-3.0-generate-001';

/**
 * Start a Veo 3 video generation job
 */
export async function startVeoJob({ prompt, imageBytes, config, modelId }) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = genAI.getGenerativeModel({ 
      model: modelId || VEO_MODEL_ID
    });

    // Prepare the generation request
    const generationConfig = {
      aspectRatio: config.aspectRatio || '9:16',
      resolution: config.resolution || '720p',
      negativePrompt: config.negativePrompt || 'low quality, washed out, jittery motion, frame drops',
      seed: config.seed || 0,
    };

    // Add image if provided for image-to-video
    const imageData = imageBytes ? {
      inlineData: {
        data: imageBytes,
        mimeType: 'image/png'
      }
    } : undefined;

    // Generate video using Veo 3 with circuit breaker and retries
    const result = await ResilientServiceCalls.callVeo(() => 
      model.generateContent({
        contents: [{
          parts: [{
            text: prompt,
            ...(imageData && { image: imageData })
          }]
        }],
        generationConfig
      })
    );

    // Extract operation details
    const operation = result.response;
    
    return {
      operation,
      jobId: operation.name || `veo-${Date.now()}`,
      status: 'processing',
      estimatedTime: 60 // Default estimate in seconds
    };

  } catch (error) {
    console.error('Veo job start error:', error);
    throw new Error(`Failed to start Veo job: ${error.message}`);
  }
}

/**
 * Poll a Veo 3 operation until completion
 */
export async function pollVeo(operationName, jobId = null) {
  try {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5s intervals)
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      // Check for job cancellation if jobId is provided
      if (jobId) {
        try {
          const { data: jobCheck } = await supabase
            .from('veo_jobs')
            .select('cancelled')
            .eq('id', jobId)
            .single();

          if (jobCheck?.cancelled) {
            console.log(`Job ${jobId} cancelled during polling`);
            return {
              status: 'cancelled',
              error: 'Job was cancelled by user'
            };
          }
        } catch (cancelError) {
          console.warn('Failed to check cancellation status:', cancelError.message);
        }
      }
      
      try {
        // Poll the operation status with circuit breaker and retries
        const operation = await ResilientServiceCalls.callVeo(() => 
          checkOperationStatus(operationName)
        );
        
        if (operation.done) {
          const videoResult = extractVideoResult(operation);
          return {
            status: 'completed',
            videoUrl: videoResult.videoUrl,
            thumbnailUrl: videoResult.thumbnailUrl,
            duration: videoResult.duration,
            metadata: videoResult.metadata
          };
        }
        
        attempts++;
      } catch (pollError) {
        console.error('Polling error:', pollError);
        throw new Error('Failed to poll operation status');
      }
    }

    throw new Error('Operation timed out');

  } catch (error) {
    console.error('Veo polling error:', error);
    throw new Error(`Failed to poll Veo operation: ${error.message}`);
  }
}

/**
 * Check operation status (placeholder implementation)
 * In production, this would use the actual Gemini API polling mechanism
 */
async function checkOperationStatus(operationName) {
  // This is a placeholder - in practice, you'd use the actual Gemini API
  // to check operation status. For now, we'll simulate the process.
  
  // Simulate processing time
  const processingTime = Math.random() * 30 + 30; // 30-60 seconds
  const elapsed = Date.now() - parseInt(operationName.split('-').pop());
  
  if (elapsed > processingTime * 1000) {
    return {
      name: operationName,
      done: true,
      response: {
        generatedVideos: [{
          video: {
            uri: `https://storage.googleapis.com/veo-generated/${operationName}.mp4`,
            thumbnailUri: `https://storage.googleapis.com/veo-generated/${operationName}_thumb.jpg`,
            duration: 8.0
          }
        }]
      }
    };
  }
  
  return {
    name: operationName,
    done: false
  };
}

/**
 * Extract video result from completed operation
 */
function extractVideoResult(operation) {
  try {
    const video = operation.response?.generatedVideos?.[0]?.video;
    
    if (!video) {
      throw new Error('No video found in operation result');
    }

    return {
      videoUrl: video.uri,
      thumbnailUrl: video.thumbnailUri,
      duration: video.duration || 8.0,
      metadata: {
        aspectRatio: video.aspectRatio,
        resolution: video.resolution,
        format: video.format || 'mp4'
      }
    };
  } catch (error) {
    console.error('Error extracting video result:', error);
    throw new Error('Failed to extract video result');
  }
}

/**
 * Download and convert image to base64 for image-to-video
 */
export async function downloadAndConvertImage(imageUrl) {
  try {
    // Validate URL
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      throw new Error('Invalid image URL: must be http(s)');
    }

    const response = await ResilientServiceCalls.callSupabase(() => 
      fetch(imageUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Veo3-Generator/1.0'
        }
      })
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Check content length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Image too large: maximum 10MB allowed');
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return {
      base64,
      mimeType: response.headers.get('content-type') || 'image/png',
      size: arrayBuffer.byteLength
    };
  } catch (error) {
    console.error('Image download error:', error);
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Upload video to Supabase storage
 */
export async function uploadVideoToStorage(userId, jobId, videoUrl) {
  try {
    // Download the video from the generated URL with circuit breaker and retries
    const response = await ResilientServiceCalls.callSupabase(() => 
      fetch(videoUrl)
    );
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const videoBuffer = await response.arrayBuffer();
    const fileName = `${userId}/${jobId}.mp4`;
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('renders')
      .upload(fileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload to storage: ${error.message}`);
    }

    // Generate signed URL for download
    const { data: signedUrlData } = supabase.storage
      .from('renders')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    return {
      path: data.path,
      signedUrl: signedUrlData?.signedUrl,
      publicUrl: `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/renders/${fileName}`
    };
  } catch (error) {
    console.error('Video upload error:', error);
    throw new Error(`Failed to upload video: ${error.message}`);
  }
}

/**
 * Generate thumbnail from video (placeholder)
 */
export async function generateThumbnail(videoUrl) {
  // In production, you would use FFmpeg or similar to extract a thumbnail
  // For now, return a placeholder
  return `${videoUrl.replace('.mp4', '_thumb.jpg')}`;
}