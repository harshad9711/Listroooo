/**
 * Product-to-Prompt Composer
 * Converts Shopify products into structured VeoPromptJSON
 */

import { createClient } from '@supabase/supabase-js';
import { VeoPromptZ, validateVeoPrompt } from './veo3Schema.js';
import { getPlatformPresets, buildPromptString } from './veo3Composer.js';
import { enhanceComposerWithRAG } from './rag.js';
import { isEnabled } from './flags.js';
import pino from 'pino';

const logger = pino({ name: 'product-prompt' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface ProductPromptRequest {
  productId: string;
  variantId?: string;
  goal?: string;
  platform?: string;
  brandKitId?: string;
  campaign?: string;
  cta?: string;
  seed?: number;
}

export interface ProductPromptResult {
  success: boolean;
  json?: any;
  prompt?: string;
  product?: any;
  variant?: any;
  error?: string;
}

// =========================
// MAIN COMPOSER
// =========================

export async function composeFromProduct(
  request: ProductPromptRequest,
  orgId: string
): Promise<ProductPromptResult> {
  try {
    // Get product with variants and media
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        product_variants(*),
        product_media(*)
      `)
      .eq('id', request.productId)
      .eq('org_id', orgId)
      .single();

    if (productError || !product) {
      return {
        success: false,
        error: 'Product not found'
      };
    }

    // Get specific variant if requested
    let variant = null;
    if (request.variantId) {
      variant = product.product_variants.find((v: any) => v.id === request.variantId);
    } else {
      // Use first available variant
      variant = product.product_variants.find((v: any) => v.available) || product.product_variants[0];
    }

    // Get brand kit if provided
    let brandKit = null;
    if (request.brandKitId) {
      const { data: brandKitData } = await supabase
        .from('veo_brand_kits')
        .select('*')
        .eq('id', request.brandKitId)
        .eq('org_id', orgId)
        .single();
      
      brandKit = brandKitData;
    }

    // Build the VeoPromptJSON
    const platform = request.platform || 'tiktok';
    const platformPresets = getPlatformPresets(platform);
    
    const idea = buildProductIdea(product, variant);
    const goal = request.goal || 'product awareness';
    const cta = request.cta || 'Shop now';
    
    // Build visual references from product media
    const visualRefs = buildVisualRefs(product.product_media);
    
    // Build shot plan
    const shotPlan = buildShotPlan(product, variant, cta);
    
    // Build audio scaffold
    const audio = buildAudioScaffold(product, variant);

    // Create base prompt JSON
    const promptJson = {
      idea,
      goal,
      platform,
      aspect: platformPresets.aspect,
      resolution: platformPresets.resolution,
      durationSec: 8,
      visualRefs,
      shotPlan,
      audio,
      cta,
      seed: request.seed || 0,
      campaign: request.campaign,
      productId: product.id,
      variantId: variant?.id
    };

    // Enhance with RAG if enabled
    if (await isEnabled(orgId, 'composer_rag') && brandKit) {
      try {
        const ragResult = await enhanceComposerWithRAG(
          orgId,
          idea,
          goal,
          platform,
          brandKit
        );
        
        // Add RAG context to the prompt
        promptJson.ragContext = ragResult.context;
        promptJson.complianceRules = ragResult.complianceRules;
      } catch (ragError) {
        logger.warn('RAG enhancement failed for product prompt:', ragError);
      }
    }

    // Add brand kit context
    if (brandKit) {
      promptJson.brandColors = brandKit.colors;
      promptJson.brandFonts = brandKit.fonts;
      promptJson.brandTone = brandKit.tone;
    }

    // Validate the prompt
    const validation = validateVeoPrompt(promptJson);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      };
    }

    const promptString = buildPromptString(promptJson);

    return {
      success: true,
      json: promptJson,
      prompt: promptString,
      product,
      variant
    };

  } catch (error) {
    logger.error({ error: error.message, request }, 'Product prompt composition failed');
    return {
      success: false,
      error: 'Failed to compose product prompt'
    };
  }
}

// =========================
// HELPER FUNCTIONS
// =========================

function buildProductIdea(product: any, variant: any): string {
  // Extract key positioning from title and first sentence of body_html
  let idea = product.title;
  
  if (product.body_html) {
    // Strip HTML and get first sentence
    const textContent = product.body_html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const firstSentence = textContent.split('.')[0];
    if (firstSentence && firstSentence.length > 10) {
      idea += ` - ${firstSentence}`;
    }
  }

  // Add pricing context if available
  if (variant?.price_cents) {
    const price = (variant.price_cents / 100).toFixed(2);
    const comparePrice = variant.compare_at_cents ? (variant.compare_at_cents / 100).toFixed(2) : null;
    
    if (comparePrice && parseFloat(comparePrice) > parseFloat(price)) {
      idea += ` - Now $${price} (was $${comparePrice})`;
    } else {
      idea += ` - $${price}`;
    }
  }

  // Add product type context
  if (product.product_type) {
    idea += ` - ${product.product_type}`;
  }

  return idea;
}

function buildVisualRefs(media: any[]): any[] {
  // Take top 1-3 images, prioritizing product images
  const images = media
    .filter(m => m.mime_type?.startsWith('image/'))
    .slice(0, 3);

  return images.map((image, index) => ({
    kind: 'product',
    url: image.url,
    alt: image.alt || `Product image ${index + 1}`,
    role: index === 0 ? 'hero' : 'supporting'
  }));
}

function buildShotPlan(product: any, variant: any, cta: string): any[] {
  const shots = [];

  // Hook shot (0-2s)
  shots.push({
    startTime: 0,
    endTime: 2,
    description: `Hook: ${product.title} - ${extractKeyBenefit(product)}`,
    camera: 'close-up',
    action: 'product reveal'
  });

  // Feature shot (2-4s)
  shots.push({
    startTime: 2,
    endTime: 4,
    description: `Feature: ${extractMainFeature(product)}`,
    camera: 'medium',
    action: 'product demonstration'
  });

  // Social proof shot (4-6s)
  if (product.tags?.includes('bestseller') || product.tags?.includes('popular')) {
    shots.push({
      startTime: 4,
      endTime: 6,
      description: 'Social proof: Bestseller/Popular choice',
      camera: 'wide',
      action: 'social proof display'
    });
  } else {
    shots.push({
      startTime: 4,
      endTime: 6,
      description: 'Product benefits and quality',
      camera: 'medium',
      action: 'benefit highlight'
    });
  }

  // CTA/Packshot (6-8s)
  shots.push({
    startTime: 6,
    endTime: 8,
    description: `CTA: ${cta} - Final product showcase`,
    camera: 'close-up',
    action: 'call-to-action'
  });

  return shots;
}

function buildAudioScaffold(product: any, variant: any): any {
  const benefits = extractKeyBenefits(product);
  
  return {
    voiceover: {
      script: `Introducing ${product.title}. ${benefits.join(' ')} ${extractCTA(product)}`,
      tone: 'energetic',
      pace: 'medium'
    },
    music: {
      style: 'upbeat',
      volume: 0.7
    },
    soundEffects: {
      productReveal: true,
      transition: true
    }
  };
}

function extractKeyBenefit(product: any): string {
  // Extract from tags or body_html
  if (product.tags?.includes('organic')) return '100% Organic';
  if (product.tags?.includes('premium')) return 'Premium Quality';
  if (product.tags?.includes('sustainable')) return 'Eco-Friendly';
  if (product.tags?.includes('fast')) return 'Lightning Fast';
  
  // Fallback to product type
  return product.product_type || 'High Quality';
}

function extractMainFeature(product: any): string {
  if (product.body_html) {
    const text = product.body_html.replace(/<[^>]*>/g, ' ');
    const sentences = text.split('.').filter(s => s.trim().length > 20);
    return sentences[0]?.trim() || 'Premium features';
  }
  
  return 'Key features and benefits';
}

function extractKeyBenefits(product: any): string[] {
  const benefits = [];
  
  if (product.tags?.includes('organic')) benefits.push('100% organic');
  if (product.tags?.includes('premium')) benefits.push('premium quality');
  if (product.tags?.includes('sustainable')) benefits.push('eco-friendly');
  if (product.tags?.includes('fast')) benefits.push('lightning fast delivery');
  
  if (benefits.length === 0) {
    benefits.push('high quality', 'great value');
  }
  
  return benefits;
}

function extractCTA(product: any): string {
  if (product.tags?.includes('limited')) return 'Limited time offer - Shop now!';
  if (product.tags?.includes('new')) return 'New arrival - Get yours today!';
  return 'Shop now and experience the difference!';
}

