-- Veo 3 Production Enterprise Migration
-- This migration adds enterprise features: orgs, billing, API keys, webhooks, etc.

-- =========================
-- ORGANIZATIONS & TEAMS
-- =========================

-- Create organizations table
CREATE TABLE IF NOT EXISTS veo_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  billing_email TEXT,
  billing_address JSONB,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization members table
CREATE TABLE IF NOT EXISTS veo_organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}',
  invited_by UUID,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- =========================
-- BILLING & SUBSCRIPTIONS
-- =========================

-- Create Stripe customers table
CREATE TABLE IF NOT EXISTS veo_stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS veo_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create usage records table
CREATE TABLE IF NOT EXISTS veo_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  job_id UUID REFERENCES veo_jobs(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('render', 'api_call', 'storage_gb', 'bandwidth_gb')),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  stripe_invoice_id TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- API KEYS & AUTHENTICATION
-- =========================

-- Create API keys table
CREATE TABLE IF NOT EXISTS veo_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  permissions JSONB DEFAULT '{}',
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create API key usage table
CREATE TABLE IF NOT EXISTS veo_api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES veo_api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- WEBHOOKS
-- =========================

-- Create webhook endpoints table
CREATE TABLE IF NOT EXISTS veo_webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  retry_attempts INTEGER DEFAULT 3,
  timeout_ms INTEGER DEFAULT 30000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook deliveries table
CREATE TABLE IF NOT EXISTS veo_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id UUID NOT NULL REFERENCES veo_webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  response_status INTEGER,
  response_body TEXT,
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- CDN & STORAGE
-- =========================

-- Create CDN assets table
CREATE TABLE IF NOT EXISTS veo_cdn_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  job_id UUID REFERENCES veo_jobs(id) ON DELETE SET NULL,
  s3_key TEXT NOT NULL,
  s3_bucket TEXT NOT NULL,
  cloudfront_url TEXT,
  content_type TEXT NOT NULL,
  content_length BIGINT NOT NULL,
  etag TEXT,
  metadata JSONB DEFAULT '{}',
  lifecycle_status TEXT DEFAULT 'active' CHECK (lifecycle_status IN ('active', 'archived', 'deleted')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- QUEUE & WORKERS
-- =========================

-- Create job queue table
CREATE TABLE IF NOT EXISTS veo_queue_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name TEXT NOT NULL,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed', 'delayed')),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- AUDIT & ANALYTICS
-- =========================

-- Create audit logs table
CREATE TABLE IF NOT EXISTS veo_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES veo_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics events table
CREATE TABLE IF NOT EXISTS veo_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES veo_organizations(id) ON DELETE CASCADE,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- INDEXES FOR PERFORMANCE
-- =========================

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_veo_organizations_slug ON veo_organizations(slug);
CREATE INDEX IF NOT EXISTS idx_veo_organizations_plan ON veo_organizations(plan);
CREATE INDEX IF NOT EXISTS idx_veo_organizations_created_at ON veo_organizations(created_at);

-- Member indexes
CREATE INDEX IF NOT EXISTS idx_veo_org_members_org_id ON veo_organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_org_members_user_id ON veo_organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_veo_org_members_role ON veo_organization_members(role);

-- Billing indexes
CREATE INDEX IF NOT EXISTS idx_veo_stripe_customers_org_id ON veo_stripe_customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_stripe_customers_stripe_id ON veo_stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_veo_subscriptions_org_id ON veo_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_subscriptions_status ON veo_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_veo_usage_records_org_id ON veo_usage_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_usage_records_period ON veo_usage_records(period_start, period_end);

-- API key indexes
CREATE INDEX IF NOT EXISTS idx_veo_api_keys_org_id ON veo_api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_api_keys_key_hash ON veo_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_veo_api_keys_key_prefix ON veo_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_veo_api_keys_active ON veo_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_veo_api_key_usage_api_key_id ON veo_api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_veo_api_key_usage_created_at ON veo_api_key_usage(created_at);

-- Webhook indexes
CREATE INDEX IF NOT EXISTS idx_veo_webhook_endpoints_org_id ON veo_webhook_endpoints(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_webhook_endpoints_active ON veo_webhook_endpoints(is_active);
CREATE INDEX IF NOT EXISTS idx_veo_webhook_deliveries_endpoint_id ON veo_webhook_deliveries(webhook_endpoint_id);
CREATE INDEX IF NOT EXISTS idx_veo_webhook_deliveries_status ON veo_webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_veo_webhook_deliveries_retry ON veo_webhook_deliveries(next_retry_at) WHERE status = 'retrying';

-- CDN indexes
CREATE INDEX IF NOT EXISTS idx_veo_cdn_assets_org_id ON veo_cdn_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_cdn_assets_s3_key ON veo_cdn_assets(s3_key);
CREATE INDEX IF NOT EXISTS idx_veo_cdn_assets_lifecycle ON veo_cdn_assets(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_veo_cdn_assets_expires ON veo_cdn_assets(expires_at) WHERE lifecycle_status = 'active';

-- Queue indexes
CREATE INDEX IF NOT EXISTS idx_veo_queue_jobs_queue_name ON veo_queue_jobs(queue_name);
CREATE INDEX IF NOT EXISTS idx_veo_queue_jobs_status ON veo_queue_jobs(status);
CREATE INDEX IF NOT EXISTS idx_veo_queue_jobs_priority ON veo_queue_jobs(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_veo_queue_jobs_retry ON veo_queue_jobs(created_at) WHERE status = 'failed' AND attempts < max_attempts;

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_veo_audit_logs_org_id ON veo_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_audit_logs_user_id ON veo_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_veo_audit_logs_action ON veo_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_veo_audit_logs_created_at ON veo_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_veo_analytics_events_org_id ON veo_analytics_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_analytics_events_type ON veo_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_veo_analytics_events_created_at ON veo_analytics_events(created_at);

-- =========================
-- ROW LEVEL SECURITY
-- =========================

-- Enable RLS on all tables
ALTER TABLE veo_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_api_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_cdn_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_analytics_events ENABLE ROW LEVEL SECURITY;

-- Organization policies
CREATE POLICY "Users can view organizations they belong to" ON veo_organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update organizations they own" ON veo_organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Member policies
CREATE POLICY "Users can view members of their organizations" ON veo_organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage members" ON veo_organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- API key policies
CREATE POLICY "Users can manage their organization's API keys" ON veo_api_keys
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Webhook policies
CREATE POLICY "Users can manage their organization's webhooks" ON veo_webhook_endpoints
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- CDN asset policies
CREATE POLICY "Users can view their organization's assets" ON veo_cdn_assets
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =========================
-- UPDATE EXISTING TABLES
-- =========================

-- Add organization_id to existing tables
ALTER TABLE veo_jobs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES veo_organizations(id) ON DELETE CASCADE;
ALTER TABLE veo_templates ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES veo_organizations(id) ON DELETE CASCADE;
ALTER TABLE veo_brand_kits ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES veo_organizations(id) ON DELETE CASCADE;
ALTER TABLE veo_brand_assets ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES veo_organizations(id) ON DELETE CASCADE;
ALTER TABLE veo_variations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES veo_organizations(id) ON DELETE CASCADE;
ALTER TABLE veo_shareable_links ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES veo_organizations(id) ON DELETE CASCADE;

-- Add indexes for organization_id
CREATE INDEX IF NOT EXISTS idx_veo_jobs_organization_id ON veo_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_templates_organization_id ON veo_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_brand_kits_organization_id ON veo_brand_kits(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_brand_assets_organization_id ON veo_brand_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_variations_organization_id ON veo_variations(organization_id);
CREATE INDEX IF NOT EXISTS idx_veo_shareable_links_organization_id ON veo_shareable_links(organization_id);

-- =========================
-- FUNCTIONS & TRIGGERS
-- =========================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_veo_organizations_updated_at BEFORE UPDATE ON veo_organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_veo_stripe_customers_updated_at BEFORE UPDATE ON veo_stripe_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_veo_subscriptions_updated_at BEFORE UPDATE ON veo_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_veo_api_keys_updated_at BEFORE UPDATE ON veo_api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_veo_webhook_endpoints_updated_at BEFORE UPDATE ON veo_webhook_endpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_veo_cdn_assets_updated_at BEFORE UPDATE ON veo_cdn_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
BEGIN
    RETURN 'veo_' || encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to hash API key
CREATE OR REPLACE FUNCTION hash_api_key(key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

