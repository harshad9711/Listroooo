import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import axios from 'axios';
import pino from 'pino';

const logger = pino({ name: 'webhooks' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// WEBHOOK ENDPOINT MANAGEMENT
// =========================

export async function createWebhookEndpoint(organizationId: string, userId: string, endpointData: {
  name: string;
  url: string;
  events: string[];
  retryAttempts?: number;
  timeoutMs?: number;
}) {
  try {
    const { name, url, events, retryAttempts = 3, timeoutMs = 30000 } = endpointData;

    // Generate webhook secret
    const secret = randomBytes(32).toString('hex');

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

export async function getWebhookEndpoints(organizationId: string, userId: string) {
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

export async function getWebhookEndpoint(organizationId: string, webhookId: string) {
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

export async function updateWebhookEndpoint(organizationId: string, webhookId: string, updateData: {
  name?: string;
  url?: string;
  events?: string[];
  isActive?: boolean;
  retryAttempts?: number;
  timeoutMs?: number;
}) {
  try {
    const { name, url, events, isActive, retryAttempts, timeoutMs } = updateData;

    const updateFields: any = {};
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

export async function deleteWebhookEndpoint(organizationId: string, webhookId: string) {
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

export async function deliverWebhook(organizationId: string, eventType: string, payload: any) {
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
      await queueWebhookDelivery(endpoint.id, eventType, payload, organizationId);
    }

    logger.info({ organizationId, eventType, endpointCount: endpoints.length }, 'Webhook deliveries queued');
  } catch (error) {
    logger.error({ organizationId, eventType, error: error.message }, 'Failed to deliver webhook');
    throw error;
  }
}

async function queueWebhookDelivery(webhookEndpointId: string, eventType: string, payload: any, organizationId: string) {
  try {
    // Create webhook delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from('veo_webhook_deliveries')
      .insert({
        webhook_endpoint_id: webhookEndpointId,
        event_type: eventType,
        payload,
        status: 'pending',
        attempt_count: 0,
        max_attempts: 3,
      })
      .select()
      .single();

    if (deliveryError) {
      throw new Error(`Failed to create webhook delivery: ${deliveryError.message}`);
    }

    // Process delivery immediately
    await processWebhookDelivery(delivery.id);

    return delivery;
  } catch (error) {
    logger.error({ webhookEndpointId, eventType, error: error.message }, 'Failed to queue webhook delivery');
    throw error;
  }
}

export async function processWebhookDelivery(deliveryId: string) {
  try {
    // Get webhook delivery record
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

    // Attempt delivery
    await attemptWebhookDelivery(delivery.id, delivery.veo_webhook_endpoints, delivery.payload);

    return delivery;
  } catch (error) {
    logger.error({ deliveryId, error: error.message }, 'Failed to process webhook delivery');
    throw error;
  }
}

async function attemptWebhookDelivery(deliveryId: string, endpoint: any, payload: any) {
  try {
    // Generate signature using the new sign function
    const payloadString = JSON.stringify(payload);
    const { header: signature } = sign(payloadString, endpoint.secret);

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
// WEBHOOK SIGNATURES
// =========================

export function generateWebhookSignature(payload: any, secret: string): string {
  const payloadString = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash('sha256')
    .update(`${timestamp}.${payloadString}`)
    .digest('hex');
  
  return `t=${timestamp},s=${signature}`;
}

export function sign(body: string, secret: string) {
  const t = Math.floor(Date.now() / 1000);
  const mac = createHash('sha256')
    .update(`${t}.${body}`)
    .digest('hex');
  return { header: `t=${t}, s=${mac}` };
}

export function verifyWebhookSignature(payload: any, signature: string, secret: string): boolean {
  const match = signature.match(/t=(\d+), s=(.+)/);
  if (!match) return false;

  const timestamp = parseInt(match[1]);
  const providedSignature = match[2];

  // Check timestamp (5 minute tolerance)
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > 300) return false;

  const payloadString = JSON.stringify(payload);
  const expectedSignature = createHash('sha256')
    .update(`${timestamp}.${payloadString}`)
    .digest('hex');

  return providedSignature === expectedSignature;
}

// =========================
// HELPER FUNCTIONS
// =========================

function getRetryDelay(attemptNumber: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 32000);
}

// =========================
// EXPORTS
// =========================

export const WEBHOOK_EVENTS = {
  // Video generation
  VIDEO_CREATED: 'veo.job.created',
  VIDEO_UPDATED: 'veo.job.updated',
  VIDEO_COMPLETED: 'veo.job.completed',
  VIDEO_FAILED: 'veo.job.failed',
  
  // Batch processing
  BATCH_COMPLETED: 'veo.batch.completed',
};
