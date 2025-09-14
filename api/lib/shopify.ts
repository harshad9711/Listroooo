/**
 * Shopify Integration
 * Handles OAuth, product sync, and webhook processing
 */

import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import pino from 'pino';

const logger = pino({ name: 'shopify' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_CLIENT_ID!,
  apiSecretKey: process.env.SHOPIFY_CLIENT_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES?.split(',') || [],
  hostName: process.env.PUBLIC_BASE_URL!.replace(/^https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
});

// =========================
// TYPES
// =========================

export interface Store {
  id: string;
  org_id: string;
  provider: 'shopify';
  shop_domain: string;
  access_token_enc: string;
  installed_at: string;
  last_sync_at?: string;
}

export interface Product {
  id: string;
  org_id: string;
  store_id: string;
  external_id: string;
  handle?: string;
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  external_id: string;
  title?: string;
  price_cents?: number;
  compare_at_cents?: number;
  sku?: string;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  url: string;
  mime_type?: string;
  alt?: string;
  created_at: string;
}

// =========================
// ENCRYPTION
// =========================

function encryptToken(token: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.SHOPIFY_CLIENT_SECRET!, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decryptToken(encryptedToken: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.SHOPIFY_CLIENT_SECRET!, 'salt', 32);
  
  const [ivHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// =========================
// OAUTH
// =========================

export function getAuthUrl(orgId: string): string {
  const state = crypto.randomBytes(16).toString('hex');
  
  // Store state in session or database for verification
  // For now, we'll include orgId in the state
  const stateWithOrg = `${orgId}:${state}`;
  
  return shopify.auth.buildAuthURL({
    shop: '', // Will be provided by user
    state: stateWithOrg,
    redirectUri: process.env.SHOPIFY_REDIRECT_URI!,
  });
}

export async function handleCallback(
  code: string,
  shop: string,
  state: string
): Promise<{ success: boolean; orgId?: string; error?: string }> {
  try {
    // Verify state and extract orgId
    const [orgId, stateToken] = state.split(':');
    if (!orgId || !stateToken) {
      throw new Error('Invalid state parameter');
    }

    // Exchange code for access token
    const session = await shopify.auth.callback({
      rawRequest: { url: `https://${shop}/admin/oauth/callback?code=${code}&state=${state}` } as any,
      rawResponse: { headers: {} } as any,
    });

    if (!session.accessToken) {
      throw new Error('Failed to get access token');
    }

    // Encrypt and store token
    const encryptedToken = encryptToken(session.accessToken);
    
    const { error } = await supabase
      .from('stores')
      .upsert({
        org_id: orgId,
        provider: 'shopify',
        shop_domain: shop,
        access_token_enc: encryptedToken,
        installed_at: new Date().toISOString(),
        last_sync_at: null
      }, {
        onConflict: 'shop_domain'
      });

    if (error) {
      logger.error({ error: error.message }, 'Failed to store store credentials');
      throw error;
    }

    logger.info({ orgId, shop }, 'Store connected successfully');
    
    return { success: true, orgId };
  } catch (error) {
    logger.error({ error: error.message }, 'OAuth callback failed');
    return { success: false, error: error.message };
  }
}

// =========================
// PRODUCT SYNC
// =========================

export async function syncProducts(orgId: string, storeId: string): Promise<{
  success: boolean;
  productsCount: number;
  error?: string;
}> {
  try {
    // Get store credentials
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('shop_domain, access_token_enc')
      .eq('id', storeId)
      .eq('org_id', orgId)
      .single();

    if (storeError || !store) {
      throw new Error('Store not found');
    }

    const accessToken = decryptToken(store.access_token_enc);
    const session = {
      shop: store.shop_domain,
      accessToken,
    };

    // Initialize Shopify client
    const client = new shopify.clients.Rest({ session });

    let productsCount = 0;
    let pageInfo = null;

    do {
      // Fetch products with pagination
      const response = await client.get({
        path: 'products',
        query: {
          limit: '250',
          ...(pageInfo ? { page_info: pageInfo } : {}),
        },
      });

      const products = response.body.products;
      if (!products || products.length === 0) break;

      // Process each product
      for (const product of products) {
        await syncProduct(orgId, storeId, product);
        productsCount++;
      }

      // Get next page info
      pageInfo = response.pageInfo?.nextPageUrl ? 
        new URL(response.pageInfo.nextPageUrl).searchParams.get('page_info') : null;

    } while (pageInfo);

    // Update last sync time
    await supabase
      .from('stores')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', storeId);

    logger.info({ orgId, storeId, productsCount }, 'Product sync completed');
    
    return { success: true, productsCount };
  } catch (error) {
    logger.error({ orgId, storeId, error: error.message }, 'Product sync failed');
    return { success: false, productsCount: 0, error: error.message };
  }
}

async function syncProduct(orgId: string, storeId: string, product: any): Promise<void> {
  try {
    // Build product URL
    const productUrl = `https://${storeId.split('.')[0]}.myshopify.com/products/${product.handle}`;

    // Upsert product
    const { data: dbProduct, error: productError } = await supabase
      .from('products')
      .upsert({
        org_id: orgId,
        store_id: storeId,
        external_id: product.id.toString(),
        handle: product.handle,
        title: product.title,
        body_html: product.body_html,
        vendor: product.vendor,
        product_type: product.product_type,
        tags: product.tags,
        url: productUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'org_id,external_id'
      })
      .select()
      .single();

    if (productError) {
      logger.error({ productId: product.id, error: productError.message }, 'Failed to upsert product');
      return;
    }

    // Sync variants
    if (product.variants) {
      for (const variant of product.variants) {
        await supabase
          .from('product_variants')
          .upsert({
            product_id: dbProduct.id,
            external_id: variant.id.toString(),
            title: variant.title,
            price_cents: Math.round(parseFloat(variant.price) * 100),
            compare_at_cents: variant.compare_at_price ? 
              Math.round(parseFloat(variant.compare_at_price) * 100) : null,
            sku: variant.sku,
            available: variant.available,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'product_id,external_id'
          });
      }
    }

    // Sync media
    if (product.images) {
      for (const image of product.images) {
        await supabase
          .from('product_media')
          .upsert({
            product_id: dbProduct.id,
            url: image.src,
            mime_type: image.alt ? 'image/jpeg' : undefined,
            alt: image.alt
          }, {
            onConflict: 'product_id,url'
          });
      }
    }

  } catch (error) {
    logger.error({ productId: product.id, error: error.message }, 'Failed to sync product');
  }
}

// =========================
// WEBHOOK HANDLING
// =========================

export async function handleWebhook(
  topic: string,
  shop: string,
  body: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get store by shop domain
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, org_id')
      .eq('shop_domain', shop)
      .single();

    if (storeError || !store) {
      logger.warn({ shop, topic }, 'Store not found for webhook');
      return { success: false, error: 'Store not found' };
    }

    switch (topic) {
      case 'PRODUCTS_CREATE':
      case 'PRODUCTS_UPDATE':
        await syncProduct(store.org_id, store.id, body);
        break;
      
      case 'PRODUCTS_DELETE':
        await supabase
          .from('products')
          .update({ updated_at: new Date().toISOString() })
          .eq('store_id', store.id)
          .eq('external_id', body.id.toString());
        break;
      
      default:
        logger.info({ topic, shop }, 'Unhandled webhook topic');
    }

    return { success: true };
  } catch (error) {
    logger.error({ topic, shop, error: error.message }, 'Webhook handling failed');
    return { success: false, error: error.message };
  }
}

