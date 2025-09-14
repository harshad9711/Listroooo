import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import axios from 'axios';
import { queueManager, JOB_TYPES } from './queue.js';
import pino from 'pino';

const logger = pino({ name: 'webhooks' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =========================
// WEBHOOK ENDPOINT MANAGEMENT
// =========================

export async function createWebhookEndpoint(organizationId, userId, endpointData) {
  try {
    const { name, url, events, retryAttempts = 3, timeoutMs = 30000 } = endpointData;

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    // Store webhook endpoint
    const { data, error } = await supabase
      .from('veo_webhook_endpoints')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        name,
        url,
        secret,
        events,
        retry_attempts: retryAttempts,
        timeout_ms: timeoutMs,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create webhook endpoint: ${error.message}`);
    }

    logger.info({ organizationId, userId, webhookId: data.id }, 'Webhook endpoint created');
    return data;
  } catch (error) {
    logger.error({ organizationId, userId, error: error.message }, 'Failed to create webhook endpoint');
    throw error;
  }
}

export async function getWebhookEndpoints(organizationId, userId) {
  try {
    const { data, error } = await supabase
      .from('veo_webhook_endpoints')
      .select('id, name, url, events, is_active, retry_attempts, timeout_ms, created_at')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get webhook endpoints: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ organizationId, userId, error: error.message }, 'Failed to get webhook endpoints');
    throw error;
  }
}

export async function getWebhookEndpoint(organizationId, webhookId) {
  try {
    const { data, error } = await supabase
      .from('veo_webhook_endpoints')
      .select('*')
      .eq('id', webhookId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      throw new Error(`Webhook endpoint not found: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error({ organizationId, webhookId, error: error.message }, 'Failed to get webhook endpoint');
    throw error;
  }
}

export async function updateWebhookEndpoint(organizationId, webhookId, updateData) {
  try {
    const { name, url, events, isActive, retryAttempts, timeoutMs } = updateData;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (url !== undefined) updateFields.url = url;
    if (events !== undefined) updateFields.events = events;
    if (isActive !== undefined) updateFields.is_active = isActive;
    if (retryAttempts !== undefined) updateFields.retry_attempts = retryAttempts;
    if (timeoutMs !== undefined) updateFields.timeout_ms = timeoutMs;

    const { data, error } = await supabase
      .from('veo_webhook_endpoints')
      .update(updateFields)
      .eq('id', webhookId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update webhook endpoint: ${error.message}`);
    }

    logger.info({ organizationId, webhookId }, 'Webhook endpoint updated');
    return data;
  } catch (error) {
    logger.error({ organizationId, webhookId, error: error.message }, 'Failed to update webhook endpoint');
    throw error;
  }
}

export async function deleteWebhookEndpoint(organizationId, webhookId) {
  try {
    const { error } = await supabase
      .from('veo_webhook_endpoints')
      .delete()
      .eq('id', webhookId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to delete webhook endpoint: ${error.message}`);
    }

    logger.info({ organizationId, webhookId }, 'Webhook endpoint deleted');
    return { success: true };
  } catch (error) {
    logger.error({ organizationId, webhookId, error: error.message }, 'Failed to delete webhook endpoint');
    throw error;
  }
}

// =========================
// WEBHOOK DELIVERY
// =========================

export async function deliverWebhook(organizationId, eventType, payload) {
  try {
    // Get active webhook endpoints for this organization
    const { data: endpoints, error } = await supabase
      .from('veo_webhook_endpoints')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .contains('events', [eventType]);

    if (error) {
      throw new Error(`Failed to get webhook endpoints: ${error.message}`);
    }

    if (!endpoints || endpoints.length === 0) {
      logger.info({ organizationId, eventType }, 'No webhook endpoints found for event');
      return;
    }

    // Queue webhook deliveries
    for (const endpoint of endpoints) {
      await queueManager.addJob('webhook', JOB_TYPES.DELIVER_WEBHOOK, {
        webhookEndpointId: endpoint.id,
        eventType,
        payload,
        organizationId,
      });
    }

    logger.info({ organizationId, eventType, endpointCount: endpoints.length }, 'Webhook deliveries queued');
  } catch (error) {
    logger.error({ organizationId, eventType, error: error.message }, 'Failed to deliver webhook');
    throw error;
  }
}

export async function processWebhookDelivery(webhookEndpointId, eventType, payload) {
  try {
    // Get webhook endpoint
    const { data: endpoint, error: endpointError } = await supabase
      .from('veo_webhook_endpoints')
      .select('*')
      .eq('id', webhookEndpointId)
      .single();

    if (endpointError || !endpoint) {
      throw new Error('Webhook endpoint not found');
    }

    // Create webhook delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from('veo_webhook_deliveries')
      .insert({
        webhook_endpoint_id: webhookEndpointId,
        event_type: eventType,
        payload,
        status: 'pending',
        attempt_count: 0,
        max_attempts: endpoint.retry_attempts,
      })
      .select()
      .single();

    if (deliveryError) {
      throw new Error(`Failed to create webhook delivery: ${deliveryError.message}`);
    }

    // Attempt delivery
    await attemptWebhookDelivery(delivery.id, endpoint, payload);

    return delivery;
  } catch (error) {
    logger.error({ webhookEndpointId, eventType, error: error.message }, 'Failed to process webhook delivery');
    throw error;
  }
}

async function attemptWebhookDelivery(deliveryId, endpoint, payload) {
  try {
    // Generate signature
    const signature = generateWebhookSignature(payload, endpoint.secret);

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Veo-Signature': signature,
      'X-Veo-Event': payload.event_type,
      'X-Veo-Delivery': deliveryId,
      'User-Agent': 'Veo3-Webhook/1.0',
    };

    // Make HTTP request
    const startTime = Date.now();
    const response = await axios.post(endpoint.url, payload, {
      headers,
      timeout: endpoint.timeout_ms,
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    const responseTime = Date.now() - startTime;

    // Update delivery record
    const status = response.status >= 200 && response.status < 300 ? 'delivered' : 'failed';
    const updateData = {
      status,
      response_status: response.status,
      response_body: response.data,
      delivered_at: status === 'delivered' ? new Date().toISOString() : null,
    };

    if (status === 'failed' && endpoint.retry_attempts > 0) {
      updateData.status = 'retrying';
      updateData.next_retry_at = new Date(Date.now() + getRetryDelay(1)).toISOString();
    }

    await supabase
      .from('veo_webhook_deliveries')
      .update(updateData)
      .eq('id', deliveryId);

    logger.info({ 
      deliveryId, 
      endpointUrl: endpoint.url, 
      status: response.status, 
      responseTime 
    }, 'Webhook delivery attempted');

    return { success: status === 'delivered', response };
  } catch (error) {
    // Update delivery record with error
    await supabase
      .from('veo_webhook_deliveries')
      .update({
        status: 'failed',
        response_body: error.message,
      })
      .eq('id', deliveryId);

    logger.error({ deliveryId, endpointUrl: endpoint.url, error: error.message }, 'Webhook delivery failed');
    throw error;
  }
}

// =========================
// WEBHOOK RETRY
// =========================

export async function retryFailedWebhooks() {
  try {
    const now = new Date();
    
    // Get failed webhooks ready for retry
    const { data: deliveries, error } = await supabase
      .from('veo_webhook_deliveries')
      .select(`
        *,
        veo_webhook_endpoints!inner(*)
      `)
      .eq('status', 'retrying')
      .lte('next_retry_at', now.toISOString())
      .lt('attempt_count', 'max_attempts');

    if (error) {
      throw new Error(`Failed to get failed webhooks: ${error.message}`);
    }

    if (!deliveries || deliveries.length === 0) {
      return;
    }

    // Retry each webhook
    for (const delivery of deliveries) {
      await queueManager.addJob('webhook', JOB_TYPES.RETRY_WEBHOOK, {
        deliveryId: delivery.id,
        webhookEndpointId: delivery.webhook_endpoint_id,
        eventType: delivery.event_type,
        payload: delivery.payload,
      });
    }

    logger.info({ count: deliveries.length }, 'Failed webhooks queued for retry');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to retry webhooks');
    throw error;
  }
}

export async function processWebhookRetry(deliveryId) {
  try {
    // Get delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from('veo_webhook_deliveries')
      .select(`
        *,
        veo_webhook_endpoints!inner(*)
      `)
      .eq('id', deliveryId)
      .single();

    if (deliveryError || !delivery) {
      throw new Error('Webhook delivery not found');
    }

    // Increment attempt count
    const newAttemptCount = delivery.attempt_count + 1;

    // Update attempt count
    await supabase
      .from('veo_webhook_deliveries')
      .update({ attempt_count: newAttemptCount })
      .eq('id', deliveryId);

    // Attempt delivery
    await attemptWebhookDelivery(deliveryId, delivery.veo_webhook_endpoints, delivery.payload);

    logger.info({ deliveryId, attemptCount: newAttemptCount }, 'Webhook retry processed');
  } catch (error) {
    logger.error({ deliveryId, error: error.message }, 'Failed to process webhook retry');
    throw error;
  }
}

// =========================
// WEBHOOK SIGNATURES
// =========================

export function generateWebhookSignature(payload, secret) {
  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
  
  return `sha256=${signature}`;
}

export function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// =========================
// WEBHOOK EVENTS
// =========================

export const WEBHOOK_EVENTS = {
  // Video generation
  VIDEO_CREATED: 'video.created',
  VIDEO_UPDATED: 'video.updated',
  VIDEO_COMPLETED: 'video.completed',
  VIDEO_FAILED: 'video.failed',
  VIDEO_DELETED: 'video.deleted',
  
  // Templates
  TEMPLATE_CREATED: 'template.created',
  TEMPLATE_UPDATED: 'template.updated',
  TEMPLATE_DELETED: 'template.deleted',
  
  // Brand kits
  BRAND_KIT_CREATED: 'brand_kit.created',
  BRAND_KIT_UPDATED: 'brand_kit.updated',
  BRAND_KIT_DELETED: 'brand_kit.deleted',
  
  // Billing
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  
  // Organization
  ORGANIZATION_UPDATED: 'organization.updated',
  MEMBER_ADDED: 'member.added',
  MEMBER_REMOVED: 'member.removed',
  
  // API Keys
  API_KEY_CREATED: 'api_key.created',
  API_KEY_UPDATED: 'api_key.updated',
  API_KEY_DELETED: 'api_key.deleted',
};

// =========================
// HELPER FUNCTIONS
// =========================

function getRetryDelay(attemptNumber) {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 32000);
}

// =========================
// EXPORTS
// =========================

export {
  WEBHOOK_EVENTS,
};

