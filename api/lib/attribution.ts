/**
 * Attribution & Tracking System
 * Handles short links, UTM tracking, and conversion attribution
 */

import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import pino from 'pino';

const logger = pino({ name: 'attribution' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface LinkRequest {
  veoJobId: string;
  productId: string;
  variantId?: string;
  campaign?: string;
  cta?: string;
  seed?: number;
}

export interface LinkResult {
  success: boolean;
  shortId?: string;
  shortUrl?: string;
  targetUrl?: string;
  error?: string;
}

export interface ClickData {
  shortId: string;
  ip?: string;
  ua?: string;
  referrer?: string;
}

export interface ConversionData {
  shortId: string;
  orderId: string;
  revenueCents: number;
  currency?: string;
  verify: string;
}

// =========================
// SHORT LINK CREATION
// =========================

export async function createTrackedLink(
  request: LinkRequest,
  orgId: string
): Promise<LinkResult> {
  try {
    // Get product URL
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('url, title')
      .eq('id', request.productId)
      .eq('org_id', orgId)
      .single();

    if (productError || !product) {
      return {
        success: false,
        error: 'Product not found'
      };
    }

    if (!product.url) {
      return {
        success: false,
        error: 'Product URL not available'
      };
    }

    // Build UTM parameters
    const utmParams = buildUTMParams(request);
    const targetUrl = `${product.url}${product.url.includes('?') ? '&' : '?'}${utmParams}`;

    // Generate short ID
    const shortId = nanoid(8);

    // Store mapping
    const { error: mapError } = await supabase
      .from('creative_product_map')
      .insert({
        veo_job_id: request.veoJobId,
        product_id: request.productId,
        variant_id: request.variantId,
        campaign: request.campaign,
        cta: request.cta,
        seed: request.seed,
        short_id: shortId,
        target_url: targetUrl
      });

    if (mapError) {
      logger.error({ error: mapError.message }, 'Failed to create link mapping');
      return {
        success: false,
        error: 'Failed to create tracked link'
      };
    }

    const shortUrl = `${process.env.LINK_DOMAIN}/l/${shortId}`;

    logger.info({ shortId, veoJobId: request.veoJobId, productId: request.productId }, 'Tracked link created');

    return {
      success: true,
      shortId,
      shortUrl,
      targetUrl
    };

  } catch (error) {
    logger.error({ error: error.message, request }, 'Failed to create tracked link');
    return {
      success: false,
      error: 'Failed to create tracked link'
    };
  }
}

function buildUTMParams(request: LinkRequest): string {
  const params = new URLSearchParams();
  
  params.set('utm_source', process.env.UTM_SOURCE_DEFAULT || 'veo3');
  params.set('utm_medium', 'video');
  params.set('utm_campaign', `veo3_${request.campaign || request.veoJobId}`);
  params.set('utm_content', `s${request.seed || 0}`);
  
  if (request.variantId) {
    params.set('utm_term', request.variantId);
  }

  return params.toString();
}

// =========================
// LINK REDIRECT & CLICK TRACKING
// =========================

export async function handleLinkRedirect(
  shortId: string,
  clickData: ClickData
): Promise<{ success: boolean; targetUrl?: string; error?: string }> {
  try {
    // Get mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('creative_product_map')
      .select(`
        target_url,
        veo_job_id,
        product_id,
        products!inner(org_id)
      `)
      .eq('short_id', shortId)
      .single();

    if (mappingError || !mapping) {
      return {
        success: false,
        error: 'Link not found'
      };
    }

    // Log click
    await supabase
      .from('attrib_clicks')
      .insert({
        org_id: mapping.products.org_id,
        short_id: shortId,
        veo_job_id: mapping.veo_job_id,
        product_id: mapping.product_id,
        ip: clickData.ip,
        ua: clickData.ua,
        referrer: clickData.referrer
      });

    logger.info({ shortId, veoJobId: mapping.veo_job_id }, 'Click tracked');

    return {
      success: true,
      targetUrl: mapping.target_url
    };

  } catch (error) {
    logger.error({ error: error.message, shortId }, 'Failed to handle link redirect');
    return {
      success: false,
      error: 'Failed to process link'
    };
  }
}

// =========================
// CONVERSION TRACKING
// =========================

export async function trackConversion(
  conversionData: ConversionData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify HMAC signature
    const isValid = verifyConversionSignature(conversionData);
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid signature'
      };
    }

    // Get mapping for short ID
    const { data: mapping, error: mappingError } = await supabase
      .from('creative_product_map')
      .select(`
        veo_job_id,
        product_id,
        products!inner(org_id)
      `)
      .eq('short_id', conversionData.shortId)
      .single();

    if (mappingError || !mapping) {
      return {
        success: false,
        error: 'Link not found'
      };
    }

    // Record conversion
    const { error: conversionError } = await supabase
      .from('attrib_conversions')
      .insert({
        org_id: mapping.products.org_id,
        short_id: conversionData.shortId,
        veo_job_id: mapping.veo_job_id,
        product_id: mapping.product_id,
        order_external_id: conversionData.orderId,
        revenue_cents: conversionData.revenueCents,
        currency: conversionData.currency || 'USD'
      });

    if (conversionError) {
      logger.error({ error: conversionError.message }, 'Failed to record conversion');
      return {
        success: false,
        error: 'Failed to record conversion'
      };
    }

    logger.info({ 
      shortId: conversionData.shortId, 
      orderId: conversionData.orderId,
      revenue: conversionData.revenueCents 
    }, 'Conversion tracked');

    return { success: true };

  } catch (error) {
    logger.error({ error: error.message, conversionData }, 'Failed to track conversion');
    return {
      success: false,
      error: 'Failed to track conversion'
    };
  }
}

function verifyConversionSignature(conversionData: ConversionData): boolean {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `${timestamp}.${conversionData.shortId}.${conversionData.orderId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.PIXEL_VERIFY_SECRET!)
      .update(message)
      .digest('hex');

    return conversionData.verify === expectedSignature;
  } catch (error) {
    logger.error({ error: error.message }, 'Signature verification failed');
    return false;
  }
}

// =========================
// ANALYTICS & REPORTING
// =========================

export async function getAttributionMetrics(
  orgId: string,
  filters: {
    veoJobId?: string;
    productId?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    let query = supabase
      .from('creative_product_map')
      .select(`
        veo_job_id,
        product_id,
        campaign,
        cta,
        seed,
        created_at,
        products!inner(title, url),
        attrib_clicks(count),
        attrib_conversions(count, revenue_cents)
      `)
      .eq('products.org_id', orgId);

    if (filters.veoJobId) {
      query = query.eq('veo_job_id', filters.veoJobId);
    }

    if (filters.productId) {
      query = query.eq('product_id', filters.productId);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data: mappings, error } = await query;

    if (error) {
      logger.error({ error: error.message }, 'Failed to fetch attribution metrics');
      return {
        success: false,
        error: 'Failed to fetch metrics'
      };
    }

    // Calculate metrics for each creative
    const metrics = mappings?.map(mapping => {
      const clicks = mapping.attrib_clicks?.[0]?.count || 0;
      const conversions = mapping.attrib_conversions?.[0]?.count || 0;
      const revenue = mapping.attrib_conversions?.[0]?.revenue_cents || 0;

      return {
        veoJobId: mapping.veo_job_id,
        productId: mapping.product_id,
        productTitle: mapping.products.title,
        productUrl: mapping.products.url,
        campaign: mapping.campaign,
        cta: mapping.cta,
        seed: mapping.seed,
        clicks,
        conversions,
        revenue: revenue / 100, // Convert to dollars
        ctr: clicks > 0 ? (conversions / clicks) * 100 : 0,
        cvr: clicks > 0 ? (conversions / clicks) * 100 : 0,
        rpc: clicks > 0 ? revenue / clicks / 100 : 0, // Revenue per click in dollars
        createdAt: mapping.created_at
      };
    }) || [];

    return {
      success: true,
      data: metrics
    };

  } catch (error) {
    logger.error({ error: error.message, orgId, filters }, 'Failed to get attribution metrics');
    return {
      success: false,
      error: 'Failed to get metrics'
    };
  }
}

