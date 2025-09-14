import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { generateVariationFromTemplate } from './veo3Templates.js';
import { startVeoJob, pollVeo, uploadVideoToStorage } from './veo3Client.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key'
);

/**
 * Create a batch variation job
 */
export async function createVariationBatch(userId, batchData) {
  try {
    const { templateId, brandKitId, variations, batchName } = batchData;

    if (!templateId || !variations || !Array.isArray(variations)) {
      throw new Error('Template ID and variations array are required');
    }

    if (variations.length === 0) {
      throw new Error('At least one variation is required');
    }

    if (variations.length > 10) {
      throw new Error('Maximum 10 variations per batch');
    }

    // Create batch record
    const batchId = uuidv4();
    const { data: batch, error: batchError } = await supabase
      .from('veo_variations')
      .insert({
        id: batchId,
        user_id: userId,
        template_id: templateId,
        brand_kit_id: brandKitId,
        variation_name: batchName || `Batch ${new Date().toISOString()}`,
        token_values: variations,
        generated_json: null,
        status: 'pending'
      })
      .select()
      .single();

    if (batchError) {
      throw new Error(`Failed to create batch: ${batchError.message}`);
    }

    // Process each variation
    const variationJobs = [];
    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];
      const variationId = uuidv4();
      
      try {
        // Generate JSON from template
        const result = await generateVariationFromTemplate(userId, templateId, variation);
        
        // Create variation record
        const { data: variationRecord, error: variationError } = await supabase
          .from('veo_variations')
          .insert({
            id: variationId,
            user_id: userId,
            template_id: templateId,
            brand_kit_id: brandKitId,
            variation_name: variation.name || `Variation ${i + 1}`,
            token_values: variation,
            generated_json: result.generatedJson,
            status: 'ready'
          })
          .select()
          .single();

        if (variationError) {
          console.error(`Failed to create variation ${i + 1}:`, variationError);
          continue;
        }

        variationJobs.push({
          variationId,
          variationRecord,
          generatedJson: result.generatedJson,
          prompt: result.prompt
        });

      } catch (error) {
        console.error(`Error processing variation ${i + 1}:`, error);
        // Create error record
        await supabase
          .from('veo_variations')
          .insert({
            id: variationId,
            user_id: userId,
            template_id: templateId,
            brand_kit_id: brandKitId,
            variation_name: variation.name || `Variation ${i + 1}`,
            token_values: variation,
            generated_json: null,
            status: 'error'
          });
      }
    }

    return {
      batchId,
      batch,
      variationJobs,
      totalVariations: variations.length,
      successfulVariations: variationJobs.length
    };

  } catch (error) {
    console.error('Create variation batch error:', error);
    throw error;
  }
}

/**
 * Start rendering a variation batch
 */
export async function startVariationBatchRendering(userId, batchId) {
  try {
    // Get all ready variations in the batch
    const { data: variations, error } = await supabase
      .from('veo_variations')
      .select('*')
      .eq('user_id', userId)
      .eq('template_id', batchId)
      .eq('status', 'ready');

    if (error) {
      throw new Error(`Failed to get variations: ${error.message}`);
    }

    if (!variations || variations.length === 0) {
      throw new Error('No ready variations found');
    }

    const renderJobs = [];

    // Start rendering each variation
    for (const variation of variations) {
      try {
        // Create video generation job
        const jobId = uuidv4();
        const promptString = buildPromptString(variation.generated_json);
        
        const { data: job, error: jobError } = await supabase
          .from('veo_jobs')
          .insert({
            id: jobId,
            user_id: userId,
            template_id: variation.template_id,
            brand_kit_id: variation.brand_kit_id,
            variation_id: variation.id,
            status: 'queued',
            platform: variation.generated_json.platform,
            aspect: variation.generated_json.aspect,
            resolution: variation.generated_json.resolution || (variation.generated_json.aspect === '16:9' ? '1080p' : '720p'),
            prompt_string: promptString,
            config: {
              aspectRatio: variation.generated_json.aspect,
              resolution: variation.generated_json.resolution || (variation.generated_json.aspect === '16:9' ? '1080p' : '720p'),
              negativePrompt: variation.generated_json.negativePrompt || 'low quality, washed out, jittery motion, frame drops',
              seed: variation.generated_json.seed || 0
            },
            asset_refs: variation.generated_json.visualRefs
          })
          .select()
          .single();

        if (jobError) {
          console.error(`Failed to create job for variation ${variation.id}:`, jobError);
          continue;
        }

        // Update variation status
        await supabase
          .from('veo_variations')
          .update({ 
            status: 'processing',
            job_id: jobId
          })
          .eq('id', variation.id);

        // Start background processing
        processVariationInBackground(jobId, variation.generated_json, promptString);

        renderJobs.push({
          variationId: variation.id,
          jobId: job.id,
          variationName: variation.variation_name
        });

      } catch (error) {
        console.error(`Error starting render for variation ${variation.id}:`, error);
        
        // Update variation status to error
        await supabase
          .from('veo_variations')
          .update({ status: 'error' })
          .eq('id', variation.id);
      }
    }

    return {
      batchId,
      renderJobs,
      totalJobs: renderJobs.length
    };

  } catch (error) {
    console.error('Start variation batch rendering error:', error);
    throw error;
  }
}

/**
 * Get variation batch status
 */
export async function getVariationBatchStatus(userId, batchId) {
  try {
    // Get batch info
    const { data: batch, error: batchError } = await supabase
      .from('veo_variations')
      .select('*')
      .eq('id', batchId)
      .eq('user_id', userId)
      .single();

    if (batchError || !batch) {
      throw new Error('Batch not found');
    }

    // Get all variations in the batch
    const { data: variations, error: variationsError } = await supabase
      .from('veo_variations')
      .select('*')
      .eq('template_id', batchId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (variationsError) {
      throw new Error(`Failed to get variations: ${variationsError.message}`);
    }

    // Calculate status summary
    const statusSummary = variations.reduce((acc, variation) => {
      acc[variation.status] = (acc[variation.status] || 0) + 1;
      return acc;
    }, {});

    const completedVariations = variations.filter(v => v.status === 'completed');
    const totalVariations = variations.length;

    return {
      batch,
      variations,
      statusSummary,
      progress: {
        completed: completedVariations.length,
        total: totalVariations,
        percentage: totalVariations > 0 ? Math.round((completedVariations.length / totalVariations) * 100) : 0
      }
    };

  } catch (error) {
    console.error('Get variation batch status error:', error);
    throw error;
  }
}

/**
 * Get user's variation batches
 */
export async function getUserVariationBatches(userId, limit = 20, offset = 0) {
  try {
    const { data: batches, error } = await supabase
      .from('veo_variations')
      .select(`
        id,
        variation_name,
        template_id,
        brand_kit_id,
        status,
        created_at,
        completed_at,
        templates(name),
        brand_kits(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get batches: ${error.message}`);
    }

    return batches || [];

  } catch (error) {
    console.error('Get user variation batches error:', error);
    throw error;
  }
}

/**
 * Background processing for individual variation
 */
async function processVariationInBackground(jobId, generatedJson, promptString) {
  try {
    // Update job status to running
    await supabase
      .from('veo_jobs')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString(),
        progress: 10
      })
      .eq('id', jobId);

    // Download first image asset if any
    let imageBytes = null;
    if (generatedJson.visualRefs?.length > 0) {
      const firstImage = generatedJson.visualRefs.find(v => 
        v.kind === 'product' || v.kind === 'photo'
      );
      
      if (firstImage?.url) {
        try {
          const { downloadAndConvertImage } = await import('./veo3Client.js');
          const imageData = await downloadAndConvertImage(firstImage.url);
          imageBytes = imageData.base64;
        } catch (error) {
          console.warn('Failed to download image for job', jobId, error);
          // Continue without image
        }
      }
    }

    // Update progress
    await supabase
      .from('veo_jobs')
      .update({ progress: 30 })
      .eq('id', jobId);

    // Start Veo job
    const jobResult = await startVeoJob({
      prompt: promptString,
      imageBytes,
      config: {
        aspectRatio: generatedJson.aspect,
        resolution: generatedJson.resolution || (generatedJson.aspect === '16:9' ? '1080p' : '720p'),
        negativePrompt: generatedJson.negativePrompt || 'low quality, washed out, jittery motion, frame drops',
        seed: generatedJson.seed || 0
      }
    });

    // Update job with operation name
    await supabase
      .from('veo_jobs')
      .update({ 
        operation_name: jobResult.jobId,
        progress: 50
      })
      .eq('id', jobId);

    // Poll for completion
    const result = await pollVeo(jobResult.jobId);

    if (result.status === 'completed') {
      // Upload video to storage
      const uploadResult = await uploadVideoToStorage(
        generatedJson.user_id || 'unknown',
        jobId,
        result.videoUrl
      );

      // Update job as completed
      await supabase
        .from('veo_jobs')
        .update({
          status: 'done',
          progress: 100,
          output_url: uploadResult.path,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      // Update variation status
      await supabase
        .from('veo_variations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('job_id', jobId);

    } else {
      throw new Error('Video generation failed');
    }

  } catch (error) {
    console.error('Variation processing error:', error);
    
    // Update job as failed
    await supabase
      .from('veo_jobs')
      .update({
        status: 'error',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // Update variation status
    await supabase
      .from('veo_variations')
      .update({
        status: 'error',
        completed_at: new Date().toISOString()
      })
      .eq('job_id', jobId);
  }
}

/**
 * Build prompt string from VeoPromptJSON (reuse existing function)
 */
function buildPromptString(prompt) {
  const lines = [];
  
  // Header
  lines.push(`Create an 8-second ${prompt.platform} video:`);
  lines.push(`"${prompt.idea}"`);
  lines.push(`Goal: ${prompt.goal}`);
  lines.push('');
  
  // Brand context
  if (prompt.brand.name) {
    lines.push(`Brand: ${prompt.brand.name}`);
  }
  if (prompt.brand.tone) {
    lines.push(`Tone: ${prompt.brand.tone}`);
  }
  if (prompt.brand.colors?.length > 0) {
    lines.push(`Colors: ${prompt.brand.colors.join(', ')}`);
  }
  lines.push('');
  
  // Shot plan
  lines.push('Shot Plan:');
  prompt.shotPlan.forEach((shot, i) => {
    lines.push(`${i + 1}. ${shot.tStart}s-${shot.tEnd}s: ${shot.action}`);
    if (shot.camera) lines.push(`   Camera: ${shot.camera}`);
    if (shot.composition) lines.push(`   Composition: ${shot.composition}`);
  });
  lines.push('');
  
  // Audio
  if (prompt.audio.dialogue) {
    lines.push(`Dialogue: "${prompt.audio.dialogue}"`);
  }
  if (prompt.audio.musicStyle) {
    lines.push(`Music: ${prompt.audio.musicStyle}`);
  }
  if (prompt.audio.sfx?.length > 0) {
    lines.push(`SFX: ${prompt.audio.sfx.join(', ')}`);
  }
  if (prompt.audio.captions) {
    lines.push('Include captions');
  }
  lines.push('');
  
  // CTA
  if (prompt.cta) {
    lines.push(`CTA: ${prompt.cta}`);
  }
  
  // Technical specs
  lines.push(`Format: ${prompt.aspect}, ${prompt.resolution || '720p'}`);
  if (prompt.negativePrompt) {
    lines.push(`Avoid: ${prompt.negativePrompt}`);
  }
  
  return lines.join('\n');
}

