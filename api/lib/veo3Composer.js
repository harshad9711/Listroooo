import { GoogleGenerativeAI } from '@google/generative-ai';
import { VeoPromptZ, validateVeoPrompt } from './veo3Schema.js';
import { enhanceComposerWithRAG } from './rag.js';
import { isEnabled } from './flags.js';
import { withComposerCache, generateCacheKey } from './composerCache.js';
import { ResilientServiceCalls } from './resilientCall.js';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');

/**
 * AI Idea→JSON Composer
 * Transforms a raw idea into a structured VeoPromptJSON using Gemini
 * Enhanced with RAG (Retrieval Augmented Generation) for brand knowledge
 */
export async function composeIdeaToJson({ idea, goal, platform, brandKitId, brandKit, orgId, cache }) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Sanitize and validate input
    const sanitizedIdea = sanitizeInput(idea);
    if (sanitizedIdea.length > 1000) {
      throw new Error('Idea must be 1000 characters or less');
    }

    // Check if caching is enabled
    const cacheEnabled = orgId && await isEnabled(orgId, 'composer_cache');
    
    // Get RAG chunks for cache key if RAG is enabled
    let ragChunkIds = [];
    if (orgId && await isEnabled(orgId, 'composer_rag')) {
      try {
        const ragResult = await enhanceComposerWithRAG(orgId, sanitizedIdea, goal, platform, brandKit);
        ragChunkIds = ragResult.chunks?.map(chunk => chunk.id) || [];
      } catch (ragError) {
        console.warn('RAG enhancement failed for cache key, continuing without it:', ragError.message);
      }
    }
    
    // Generate cache key
    const cacheKey = generateCacheKey(orgId, sanitizedIdea, goal, platform, brandKitId, ragChunkIds);

    // Use cache wrapper if enabled
    if (cacheEnabled && cache) {
      return await withComposerCache(
        cache,
        cacheKey,
        () => composeIdeaToJsonInternal({ idea: sanitizedIdea, goal, platform, brandKitId, brandKit, orgId }),
        { enableCache: true }
      );
    }

    // Direct execution without cache
    return await composeIdeaToJsonInternal({ idea: sanitizedIdea, goal, platform, brandKitId, brandKit, orgId });

  } catch (error) {
    console.error('Composition error:', error);
    throw new Error(`Failed to compose idea to JSON: ${error.message}`);
  }
}

async function composeIdeaToJsonInternal({ idea, goal, platform, brandKitId, brandKit, orgId }) {
  // Get platform presets
  const platformPresets = getPlatformPresets(platform);
  
  // Build brand context from brand kit if provided
  const brandContext = buildBrandContext(brandKit);

  // Check if RAG is enabled for this organization
  let ragContext = '';
  let ragChunks = [];
  let complianceRules = [];
  
  if (orgId && await isEnabled(orgId, 'composer_rag')) {
    try {
      const ragResult = await enhanceComposerWithRAG(orgId, idea, goal, platform, brandKit);
      ragContext = ragResult.context;
      ragChunks = ragResult.chunks;
      complianceRules = ragResult.complianceRules;
    } catch (ragError) {
      console.warn('RAG enhancement failed, continuing without it:', ragError.message);
    }
  }

  // Create the composition prompt
  const compositionPrompt = buildCompositionPrompt({
    idea,
    goal: goal || 'product awareness',
    platform,
    platformPresets,
    brandContext,
    ragContext,
    complianceRules
  });

  // Use Gemini to compose the JSON with circuit breaker and retries
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await ResilientServiceCalls.callGemini(() => 
    model.generateContent(compositionPrompt)
  );
  const response = await result.response;
  const text = response.text();

  // Parse and validate the JSON response
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response');
  }

  let composedJson;
  try {
    composedJson = JSON.parse(jsonMatch[1] || jsonMatch[0]);
  } catch (parseError) {
    throw new Error('Failed to parse AI-generated JSON');
  }

  // Validate against Zod schema
  const validation = validateVeoPrompt(composedJson);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Ensure platform and aspect are set correctly
  composedJson.platform = platform;
  composedJson.aspect = platformPresets.aspect;
  composedJson.resolution = platformPresets.resolution;
  composedJson.durationSec = 8;

  return {
    success: true,
    json: composedJson,
    prompt: buildPromptString(composedJson),
    ragContext: ragContext,
    ragChunks: ragChunks,
    complianceRules: complianceRules
  };
}

/**
 * Sanitize user input to prevent prompt injection
 */
function sanitizeInput(input) {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

/**
 * Get platform-specific presets
 */
function getPlatformPresets(platform) {
  const presets = {
    tiktok: { aspect: '9:16', resolution: '720p' },
    instagram_reel: { aspect: '9:16', resolution: '720p' },
    youtube_short: { aspect: '9:16', resolution: '720p' },
    youtube: { aspect: '16:9', resolution: '1080p' },
    meta_ad: { aspect: '9:16', resolution: '720p' }
  };
  
  return presets[platform] || presets.tiktok;
}

/**
 * Build brand context from brand kit
 */
function buildBrandContext(brandKit) {
  if (!brandKit) return '';

  const context = [];
  if (brandKit.name) context.push(`Brand: ${brandKit.name}`);
  if (brandKit.tone) context.push(`Tone: ${brandKit.tone}`);
  if (brandKit.colors?.length > 0) {
    context.push(`Colors: ${brandKit.colors.join(', ')}`);
  }
  if (brandKit.fonts?.length > 0) {
    context.push(`Fonts: ${brandKit.fonts.join(', ')}`);
  }

  return context.length > 0 ? `Brand Guidelines:\n${context.join('\n')}\n` : '';
}

/**
 * Build the composition prompt for Gemini
 */
function buildCompositionPrompt({ idea, goal, platform, platformPresets, brandContext, ragContext, complianceRules }) {
  let prompt = `You are an expert video creative director. Transform this raw idea into a structured JSON prompt for AI video generation.

${brandContext}`;

  // Add RAG context if available
  if (ragContext) {
    prompt += `\nBrand Knowledge Base Context:\n${ragContext}\n`;
  }

  // Add compliance rules if available
  if (complianceRules && complianceRules.length > 0) {
    prompt += `\nCompliance Requirements:\n${complianceRules.map(rule => `- ${rule}`).join('\n')}\n`;
  }

  prompt += `Platform: ${platform} (${platformPresets.aspect}, ${platformPresets.resolution})
Goal: ${goal}
Duration: 8 seconds

Raw Idea: "${idea}"

Create a comprehensive VeoPromptJSON that includes:
1. A compelling video idea based on the input
2. A clear goal and platform-optimized approach
3. A detailed shot plan with 3-5 timed shots (0-8 seconds)
4. Brand-appropriate visual and audio specifications
5. Platform-specific optimizations

Return ONLY valid JSON in this exact format:
\`\`\`json
{
  "idea": "refined video concept",
  "goal": "${goal}",
  "platform": "${platform}",
  "aspect": "${platformPresets.aspect}",
  "resolution": "${platformPresets.resolution}",
  "durationSec": 8,
  "negativePrompt": "low quality, washed out, jittery motion, frame drops",
  "seed": 0,
  "brand": {
    "name": "Brand Name",
    "colors": ["#FF6B6B", "#4ECDC4"],
    "fonts": ["Inter", "Arial"],
    "tone": "modern, confident"
  },
  "cta": "Shop now",
  "visualRefs": [
    {
      "id": "uuid-here",
      "kind": "product",
      "url": "https://example.com/image.jpg",
      "mimeType": "image/jpeg",
      "role": "hero"
    }
  ],
  "shotPlan": [
    {
      "tStart": 0,
      "tEnd": 2,
      "action": "Hook - attention-grabbing opening",
      "camera": "Close-up",
      "composition": "Dynamic angle"
    },
    {
      "tStart": 2,
      "tEnd": 5,
      "action": "Main content - product showcase",
      "camera": "Dolly in",
      "composition": "Wide to close"
    },
    {
      "tStart": 5,
      "tEnd": 8,
      "action": "CTA - call to action",
      "camera": "Static",
      "composition": "Text overlay"
    }
  ],
  "audio": {
    "dialogue": "Brief, impactful message",
    "sfx": ["whoosh", "click"],
    "ambience": "upbeat background",
    "musicStyle": "modern, energetic",
    "captions": true,
    "voiceover": "Optional voiceover script"
  }
}
\`\`\`

Requirements:
- Make it engaging and platform-appropriate
- Include specific camera movements and compositions
- Ensure shot timing adds up to 8 seconds
- Use modern, professional language
- Include relevant SFX and music suggestions
- Make it suitable for social media sharing`;
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
