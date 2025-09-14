/**
 * Shopify Commerce Routes
 * Handles OAuth, sync, and webhook endpoints
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '../middleware/auth.js';
import { getAuthUrl, handleCallback, syncProducts, handleWebhook } from '../lib/shopify.js';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import crypto from 'crypto';

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Shopify API for webhook verification
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_CLIENT_ID!,
  apiSecretKey: process.env.SHOPIFY_CLIENT_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES?.split(',') || [],
  hostName: process.env.PUBLIC_BASE_URL!.replace(/^https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
});

// =========================
// OAUTH ROUTES
// =========================

/**
 * GET /api/commerce/shopify/install
 * Redirect to Shopify OAuth
 */
router.get('/install', authenticateUser, (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Shop parameter is required' 
      });
    }

    const orgId = req.user.org_id;
    const authUrl = getAuthUrl(orgId);
    
    // Replace placeholder with actual shop
    const finalAuthUrl = authUrl.replace('shop=', `shop=${shop}`);
    
    res.redirect(finalAuthUrl);
  } catch (error) {
    console.error('Shopify install error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to initiate OAuth' 
    });
  }
});

/**
 * GET /api/commerce/shopify/callback
 * Handle OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, shop, state } = req.query;
    
    if (!code || !shop || !state) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required parameters' 
      });
    }

    const result = await handleCallback(
      code as string,
      shop as string,
      state as string
    );

    if (result.success) {
      // Redirect to success page or return success response
      res.json({
        success: true,
        message: 'Store connected successfully',
        orgId: result.orgId
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'OAuth failed'
      });
    }
  } catch (error) {
    console.error('Shopify callback error:', error);
    res.status(500).json({ 
      success: false,
      error: 'OAuth callback failed' 
    });
  }
});

// =========================
// SYNC ROUTES
// =========================

/**
 * POST /api/commerce/shopify/sync
 * Sync products from Shopify
 */
router.post('/sync', authenticateUser, async (req, res) => {
  try {
    const { storeId } = req.body;
    const orgId = req.user.org_id;

    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required' 
      });
    }

    // Verify store belongs to org
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, shop_domain')
      .eq('id', storeId)
      .eq('org_id', orgId)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ 
        success: false,
        error: 'Store not found' 
      });
    }

    const result = await syncProducts(orgId, storeId);

    if (result.success) {
      res.json({
        success: true,
        message: `Synced ${result.productsCount} products`,
        productsCount: result.productsCount
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Sync failed'
      });
    }
  } catch (error) {
    console.error('Shopify sync error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Sync failed' 
    });
  }
});

/**
 * GET /api/commerce/shopify/stores
 * Get connected stores for organization
 */
router.get('/stores', authenticateUser, async (req, res) => {
  try {
    const orgId = req.user.org_id;

    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, shop_domain, provider, installed_at, last_sync_at')
      .eq('org_id', orgId)
      .order('installed_at', { ascending: false });

    if (error) {
      console.error('Error fetching stores:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch stores' 
      });
    }

    res.json({
      success: true,
      data: stores || []
    });
  } catch (error) {
    console.error('Stores fetch error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch stores' 
    });
  }
});

// =========================
// WEBHOOK ROUTES
// =========================

/**
 * POST /api/commerce/shopify/webhook
 * Handle Shopify webhooks
 */
router.post('/webhook', async (req, res) => {
  try {
    const topic = req.get('x-shopify-topic');
    const shop = req.get('x-shopify-shop-domain');
    const hmac = req.get('x-shopify-hmac-sha256');

    if (!topic || !shop || !hmac) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing webhook headers' 
      });
    }

    // Verify webhook signature
    const body = JSON.stringify(req.body);
    const hash = crypto
      .createHmac('sha256', process.env.SHOPIFY_CLIENT_SECRET!)
      .update(body, 'utf8')
      .digest('base64');

    if (hash !== hmac) {
      console.warn('Invalid webhook signature');
      return res.status(401).json({ 
        success: false,
        error: 'Invalid signature' 
      });
    }

    const result = await handleWebhook(topic, shop, req.body);

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Webhook processing failed'
      });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Webhook processing failed' 
    });
  }
});

export default router;

