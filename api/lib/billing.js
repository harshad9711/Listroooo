import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { queueManager, JOB_TYPES } from './queue.js';
import pino from 'pino';

const logger = pino({ name: 'billing' });

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =========================
// PRICING CONFIGURATION
// =========================

const PRICING = {
  FREE: {
    renders_per_day: parseInt(process.env.RENDERS_PER_DAY_FREE || '5'),
    price_per_render: 0,
  },
  PRO: {
    renders_per_day: parseInt(process.env.RENDERS_PER_DAY_PRO || '100'),
    price_per_render: parseInt(process.env.STRIPE_PRICE_RENDER || '100'), // $1.00
    monthly_price: process.env.STRIPE_PRICE_SUB_PRO,
  },
  ENTERPRISE: {
    renders_per_day: parseInt(process.env.RENDERS_PER_DAY_ENTERPRISE || '1000'),
    price_per_render: parseInt(process.env.STRIPE_PRICE_RENDER || '50'), // $0.50
    monthly_price: process.env.STRIPE_PRICE_SUB_ENTERPRISE,
  },
};

// =========================
// CUSTOMER MANAGEMENT
// =========================

export async function createStripeCustomer(organizationId, customerData) {
  try {
    const { email, name, metadata = {} } = customerData;

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        organization_id: organizationId,
        ...metadata,
      },
    });

    // Store in database
    const { data, error } = await supabase
      .from('veo_stripe_customers')
      .insert({
        organization_id: organizationId,
        stripe_customer_id: customer.id,
        email: customer.email,
        name: customer.name,
      })
      .select()
      .single();

    if (error) {
      // Clean up Stripe customer if database insert fails
      await stripe.customers.del(customer.id);
      throw new Error(`Failed to create customer: ${error.message}`);
    }

    logger.info({ organizationId, customerId: customer.id }, 'Stripe customer created');
    return data;
  } catch (error) {
    logger.error({ organizationId, error: error.message }, 'Failed to create Stripe customer');
    throw error;
  }
}

export async function getStripeCustomer(organizationId) {
  try {
    const { data, error } = await supabase
      .from('veo_stripe_customers')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      throw new Error(`Customer not found: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error({ organizationId, error: error.message }, 'Failed to get Stripe customer');
    throw error;
  }
}

// =========================
// SUBSCRIPTION MANAGEMENT
// =========================

export async function createSubscription(organizationId, priceId, paymentMethodId) {
  try {
    const customer = await getStripeCustomer(organizationId);

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.stripe_customer_id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Store in database
    const { data, error } = await supabase
      .from('veo_subscriptions')
      .insert({
        organization_id: organizationId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    logger.info({ organizationId, subscriptionId: subscription.id }, 'Subscription created');
    return { subscription, data };
  } catch (error) {
    logger.error({ organizationId, error: error.message }, 'Failed to create subscription');
    throw error;
  }
}

export async function cancelSubscription(organizationId, subscriptionId) {
  try {
    // Cancel in Stripe
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update in database
    const { error } = await supabase
      .from('veo_subscriptions')
      .update({
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq('organization_id', organizationId)
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }

    logger.info({ organizationId, subscriptionId }, 'Subscription cancelled');
    return subscription;
  } catch (error) {
    logger.error({ organizationId, subscriptionId, error: error.message }, 'Failed to cancel subscription');
    throw error;
  }
}

// =========================
// USAGE TRACKING
// =========================

export async function trackUsage(organizationId, userId, jobId, resourceType, quantity = 1) {
  try {
    const organization = await getOrganization(organizationId);
    const plan = organization.plan;
    const pricing = PRICING[plan.toUpperCase()];

    if (!pricing) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    const unitPriceCents = pricing.price_per_render;
    const totalCents = unitPriceCents * quantity;

    // Record usage
    const { data, error } = await supabase
      .from('veo_usage_records')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        job_id: jobId,
        resource_type: resourceType,
        quantity,
        unit_price_cents: unitPriceCents,
        total_cents: totalCents,
        period_start: new Date(),
        period_end: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to track usage: ${error.message}`);
    }

    // Queue billing job for paid plans
    if (plan !== 'free' && totalCents > 0) {
      await queueManager.addJob('billing', JOB_TYPES.PROCESS_USAGE, {
        organizationId,
        usageRecordId: data.id,
        totalCents,
      });
    }

    logger.info({ organizationId, userId, jobId, resourceType, quantity, totalCents }, 'Usage tracked');
    return data;
  } catch (error) {
    logger.error({ organizationId, userId, jobId, error: error.message }, 'Failed to track usage');
    throw error;
  }
}

// =========================
// QUOTA MANAGEMENT
// =========================

export async function checkQuota(organizationId, userId) {
  try {
    const organization = await getOrganization(organizationId);
    const plan = organization.plan;
    const pricing = PRICING[plan.toUpperCase()];

    if (!pricing) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: usage, error } = await supabase
      .from('veo_usage_records')
      .select('quantity')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('resource_type', 'render')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (error) {
      throw new Error(`Failed to check quota: ${error.message}`);
    }

    const usedToday = usage.reduce((sum, record) => sum + record.quantity, 0);
    const remaining = Math.max(0, pricing.renders_per_day - usedToday);

    return {
      plan,
      usedToday,
      limit: pricing.renders_per_day,
      remaining,
      canRender: remaining > 0,
    };
  } catch (error) {
    logger.error({ organizationId, userId, error: error.message }, 'Failed to check quota');
    throw error;
  }
}

// =========================
// INVOICE MANAGEMENT
// =========================

export async function createInvoice(organizationId, usageRecords) {
  try {
    const customer = await getStripeCustomer(organizationId);

    // Create invoice items
    const invoiceItems = usageRecords.map(record => ({
      customer: customer.stripe_customer_id,
      amount: record.total_cents,
      currency: 'usd',
      description: `${record.quantity} ${record.resource_type} render(s)`,
      metadata: {
        usage_record_id: record.id,
        job_id: record.job_id,
      },
    }));

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customer.stripe_customer_id,
      auto_advance: true,
      collection_method: 'charge_automatically',
    });

    // Add invoice items
    for (const item of invoiceItems) {
      await stripe.invoiceItems.create(item);
    }

    // Finalize and send invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    await stripe.invoices.sendInvoice(finalizedInvoice.id);

    // Update usage records with invoice ID
    const usageRecordIds = usageRecords.map(record => record.id);
    await supabase
      .from('veo_usage_records')
      .update({ stripe_invoice_id: finalizedInvoice.id })
      .in('id', usageRecordIds);

    logger.info({ organizationId, invoiceId: finalizedInvoice.id }, 'Invoice created and sent');
    return finalizedInvoice;
  } catch (error) {
    logger.error({ organizationId, error: error.message }, 'Failed to create invoice');
    throw error;
  }
}

// =========================
// WEBHOOK HANDLING
// =========================

export async function handleStripeWebhook(event) {
  try {
    logger.info({ eventType: event.type }, 'Processing Stripe webhook');

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        logger.info({ eventType: event.type }, 'Unhandled webhook event type');
    }
  } catch (error) {
    logger.error({ eventType: event.type, error: error.message }, 'Failed to handle webhook');
    throw error;
  }
}

async function handleSubscriptionChange(subscription) {
  const { error } = await supabase
    .from('veo_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
}

async function handleSubscriptionDeleted(subscription) {
  const { error } = await supabase
    .from('veo_subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

async function handlePaymentSucceeded(invoice) {
  // Update organization plan if needed
  // Send confirmation email
  // Update usage records
  logger.info({ invoiceId: invoice.id }, 'Payment succeeded');
}

async function handlePaymentFailed(invoice) {
  // Send payment failure notification
  // Potentially downgrade plan
  logger.warn({ invoiceId: invoice.id }, 'Payment failed');
}

// =========================
// HELPER FUNCTIONS
// =========================

async function getOrganization(organizationId) {
  const { data, error } = await supabase
    .from('veo_organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (error) {
    throw new Error(`Organization not found: ${error.message}`);
  }

  return data;
}

// =========================
// EXPORTS
// =========================

export {
  PRICING,
  stripe,
};

