/**
 * Product Composition Routes
 * Handles product-to-prompt composition and iteration
 */

import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { composeFromProduct } from '../lib/productPrompt.js';
import { createTrackedLink } from '../lib/attribution.js';
import { createClient } from '@supabase/supabase-js';
import pino from 'pino';

const logger = pino({ name: 'product-composition' });

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// PRODUCT COMPOSITION
// =========================

/**
 * POST /api/veo3/composeFromProduct
 * Compose a VeoPromptJSON from a product
 */
router.post('/composeFromProduct', authenticateUser, async (req, res) => {
  try {
    const { productId, variantId, goal, platform, brandKitId, campaign, cta, seed } = req.body;
    const orgId = req.user.org_id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'productId is required'
      });
    }

    const result = await composeFromProduct({
      productId,
      variantId,
      goal,
      platform,
      brandKitId,
      campaign,
      cta,
      seed
    }, orgId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          json: result.json,
          prompt: result.prompt,
          product: result.product,
          variant: result.variant
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Product composition failed');
    res.status(500).json({
      success: false,
      error: 'Failed to compose product prompt'
    });
  }
});

// =========================
// PRODUCT ITERATION
// =========================

/**
 * POST /api/veo3/iterate
 * Create new batch renders based on performance data
 */
router.post('/iterate', authenticateUser, async (req, res) => {
  try {
    const { productId, baseJobId, strategy, count = 2 } = req.body;
    const orgId = req.user.org_id;

    if (!productId || !strategy) {
      return res.status(400).json({
        success: false,
        error: 'productId and strategy are required'
      });
    }

    if (!['seed', 'cta', 'hook'].includes(strategy)) {
      return res.status(400).json({
        success: false,
        error: 'Strategy must be one of: seed, cta, hook'
      });
    }

    // Get base job for reference
    let baseJob = null;
    if (baseJobId) {
      const { data: jobData } = await supabase
        .from('veo_jobs')
        .select('*')
        .eq('id', baseJobId)
        .eq('user_id', req.user.id)
        .single();
      
      baseJob = jobData;
    }

    // Get product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        product_variants(*),
        product_media(*)
      `)
      .eq('id', productId)
      .eq('org_id', orgId)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Generate iteration variations
    const iterations = await generateIterations(product, baseJob, strategy, count, orgId);

    res.json({
      success: true,
      data: {
        iterations,
        strategy,
        count: iterations.length
      }
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Product iteration failed');
    res.status(500).json({
      success: false,
      error: 'Failed to create iterations'
    });
  }
});

// =========================
// HELPER FUNCTIONS
// =========================

async function generateIterations(
  product: any,
  baseJob: any,
  strategy: string,
  count: number,
  orgId: string
): Promise<any[]> {
  const iterations = [];

  for (let i = 0; i < count; i++) {
    const overrides = generateOverrides(strategy, i, baseJob);
    
    const result = await composeFromProduct({
      productId: product.id,
      variantId: product.product_variants?.[0]?.id,
      goal: 'product awareness',
      platform: 'tiktok',
      campaign: `iteration_${strategy}_${i}`,
      cta: overrides.cta,
      seed: overrides.seed
    }, orgId);

    if (result.success) {
      iterations.push({
        index: i,
        strategy,
        overrides,
        json: result.json,
        prompt: result.prompt
      });
    }
  }

  return iterations;
}

function generateOverrides(strategy: string, index: number, baseJob: any): any {
  const overrides: any = {};

  switch (strategy) {
    case 'seed':
      overrides.seed = (baseJob?.config?.seed || 0) + index + 1;
      overrides.cta = baseJob?.cta || 'Shop now';
      break;
    
    case 'cta':
      const ctaVariations = [
        'Shop now',
        'Get yours today',
        'Order now',
        'Buy now',
        'Shop the look',
        'Discover more'
      ];
      overrides.cta = ctaVariations[index % ctaVariations.length];
      overrides.seed = baseJob?.config?.seed || 0;
      break;
    
    case 'hook':
      // This would modify the shot plan or idea
      overrides.seed = (baseJob?.config?.seed || 0) + index + 1;
      overrides.cta = baseJob?.cta || 'Shop now';
      break;
  }

  return overrides;
}

// =========================
// PRODUCT LISTS
// =========================

/**
 * GET /api/veo3/products
 * Get products for organization
 */
router.get('/products', authenticateUser, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { storeId, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('products')
      .select(`
        id,
        title,
        handle,
        vendor,
        product_type,
        tags,
        url,
        created_at,
        product_variants(id, title, price_cents, available),
        product_media(id, url, alt)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(offset as number, (offset as number) + (limit as number) - 1);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data: products, error } = await query;

    if (error) {
      logger.error({ error: error.message }, 'Failed to fetch products');
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch products'
      });
    }

    res.json({
      success: true,
      data: products || []
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Products fetch failed');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

export default router;

