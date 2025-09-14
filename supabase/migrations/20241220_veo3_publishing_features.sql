-- Veo 3 Publishing Features Migration
-- Cross-platform publishing, OAuth, moderation, localization, A/B testing

-- =========================
-- OAUTH CONNECTIONS
-- =========================

CREATE TABLE IF NOT EXISTS oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('tiktok','meta','youtube')),
  account_name TEXT,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oauth_connections_org_id ON oauth_connections(org_id);
CREATE INDEX idx_oauth_connections_user_id ON oauth_connections(user_id);
CREATE INDEX idx_oauth_connections_provider ON oauth_connections(provider);

-- RLS for OAuth connections
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's OAuth connections" ON oauth_connections
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's OAuth connections" ON oauth_connections
  FOR ALL USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- =========================
-- PUBLISHING JOBS
-- =========================

CREATE TABLE IF NOT EXISTS publish_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veo_job_id UUID NOT NULL REFERENCES veo_jobs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('tiktok','meta','youtube')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','uploading','processing','published','error','cancelled')),
  scheduled_at TIMESTAMPTZ,
  external_post_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_publish_jobs_veo_job_id ON publish_jobs(veo_job_id);
CREATE INDEX idx_publish_jobs_org_id ON publish_jobs(org_id);
CREATE INDEX idx_publish_jobs_provider ON publish_jobs(provider);
CREATE INDEX idx_publish_jobs_status ON publish_jobs(status);
CREATE INDEX idx_publish_jobs_scheduled_at ON publish_jobs(scheduled_at);

-- RLS for publish jobs
ALTER TABLE publish_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's publish jobs" ON publish_jobs
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's publish jobs" ON publish_jobs
  FOR ALL USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =========================
-- PROMPT SNAPSHOTS
-- =========================

CREATE TABLE IF NOT EXISTS veo_prompt_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veo_job_id UUID REFERENCES veo_jobs(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  json_prompt JSONB NOT NULL,
  prompt_string TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  asset_hashes JSONB NOT NULL DEFAULT '{}',
  seed INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_snapshots_veo_job_id ON veo_prompt_snapshots(veo_job_id);
CREATE INDEX idx_prompt_snapshots_org_id ON veo_prompt_snapshots(org_id);
CREATE INDEX idx_prompt_snapshots_user_id ON veo_prompt_snapshots(user_id);
CREATE INDEX idx_prompt_snapshots_created_at ON veo_prompt_snapshots(created_at);

-- RLS for prompt snapshots
ALTER TABLE veo_prompt_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's prompt snapshots" ON veo_prompt_snapshots
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's prompt snapshots" ON veo_prompt_snapshots
  FOR ALL USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =========================
-- CAMPAIGNS & EXPERIMENTS
-- =========================

CREATE TABLE IF NOT EXISTS veo_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','cancelled')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget_cents INT DEFAULT 0,
  target_platforms TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veo_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES veo_campaigns(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','completed','cancelled')),
  traffic_split DECIMAL(5,4) DEFAULT 0.5, -- 0.0 to 1.0
  control_prompt_snapshot_id UUID REFERENCES veo_prompt_snapshots(id),
  variant_prompt_snapshot_id UUID REFERENCES veo_prompt_snapshots(id),
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veo_experiment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES veo_experiments(id) ON DELETE CASCADE,
  veo_job_id UUID NOT NULL REFERENCES veo_jobs(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('control','variant')),
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for campaigns and experiments
CREATE INDEX idx_campaigns_org_id ON veo_campaigns(org_id);
CREATE INDEX idx_campaigns_status ON veo_campaigns(status);
CREATE INDEX idx_experiments_campaign_id ON veo_experiments(campaign_id);
CREATE INDEX idx_experiments_org_id ON veo_experiments(org_id);
CREATE INDEX idx_experiments_status ON veo_experiments(status);
CREATE INDEX idx_experiment_results_experiment_id ON veo_experiment_results(experiment_id);
CREATE INDEX idx_experiment_results_veo_job_id ON veo_experiment_results(veo_job_id);

-- RLS for campaigns and experiments
ALTER TABLE veo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo_experiment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's campaigns" ON veo_campaigns
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's campaigns" ON veo_campaigns
  FOR ALL USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their org's experiments" ON veo_experiments
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's experiments" ON veo_experiments
  FOR ALL USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their org's experiment results" ON veo_experiment_results
  FOR SELECT USING (
    experiment_id IN (
      SELECT id FROM veo_experiments 
      WHERE org_id IN (
        SELECT organization_id FROM veo_organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- =========================
-- CONTENT MODERATION
-- =========================

CREATE TABLE IF NOT EXISTS veo_moderation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veo_job_id UUID NOT NULL REFERENCES veo_jobs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('video','thumbnail','caption','prompt')),
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','flagged')),
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  categories JSONB DEFAULT '{}', -- detected categories
  details JSONB DEFAULT '{}', -- moderation details
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_moderation_results_veo_job_id ON veo_moderation_results(veo_job_id);
CREATE INDEX idx_moderation_results_org_id ON veo_moderation_results(org_id);
CREATE INDEX idx_moderation_results_status ON veo_moderation_results(status);
CREATE INDEX idx_moderation_results_content_type ON veo_moderation_results(content_type);

-- RLS for moderation results
ALTER TABLE veo_moderation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's moderation results" ON veo_moderation_results
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage moderation results" ON veo_moderation_results
  FOR ALL USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- =========================
-- LOCALIZATION
-- =========================

CREATE TABLE IF NOT EXISTS veo_localizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veo_job_id UUID NOT NULL REFERENCES veo_jobs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  locale TEXT NOT NULL, -- en, es, fr, de, it, pt
  caption_file_url TEXT,
  subtitle_file_url TEXT,
  tts_audio_url TEXT,
  tts_voice TEXT,
  translation_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_localizations_veo_job_id ON veo_localizations(veo_job_id);
CREATE INDEX idx_localizations_org_id ON veo_localizations(org_id);
CREATE INDEX idx_localizations_locale ON veo_localizations(locale);

-- RLS for localizations
ALTER TABLE veo_localizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's localizations" ON veo_localizations
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's localizations" ON veo_localizations
  FOR ALL USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =========================
-- AUDIT LOGS
-- =========================

CREATE TABLE IF NOT EXISTS veo_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES veo_organizations(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org_id ON veo_audit_logs(org_id);
CREATE INDEX idx_audit_logs_user_id ON veo_audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON veo_audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON veo_audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON veo_audit_logs(created_at);

-- RLS for audit logs
ALTER TABLE veo_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's audit logs" ON veo_audit_logs
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =========================
-- PERFORMANCE METRICS
-- =========================

CREATE TABLE IF NOT EXISTS veo_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veo_job_id UUID NOT NULL REFERENCES veo_jobs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_post_id TEXT,
  metrics JSONB NOT NULL DEFAULT '{}', -- views, likes, shares, comments, etc.
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_metrics_veo_job_id ON veo_performance_metrics(veo_job_id);
CREATE INDEX idx_performance_metrics_org_id ON veo_performance_metrics(org_id);
CREATE INDEX idx_performance_metrics_platform ON veo_performance_metrics(platform);
CREATE INDEX idx_performance_metrics_collected_at ON veo_performance_metrics(collected_at);

-- RLS for performance metrics
ALTER TABLE veo_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's performance metrics" ON veo_performance_metrics
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =========================
-- UPDATES TO EXISTING TABLES
-- =========================

-- Add publishing fields to veo_jobs
ALTER TABLE veo_jobs ADD COLUMN IF NOT EXISTS publish_status TEXT DEFAULT 'not_published' CHECK (publish_status IN ('not_published','queued','uploading','processing','published','error'));
ALTER TABLE veo_jobs ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected','flagged'));
ALTER TABLE veo_jobs ADD COLUMN IF NOT EXISTS experiment_id UUID REFERENCES veo_experiments(id);
ALTER TABLE veo_jobs ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES veo_campaigns(id);

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_veo_jobs_publish_status ON veo_jobs(publish_status);
CREATE INDEX IF NOT EXISTS idx_veo_jobs_moderation_status ON veo_jobs(moderation_status);
CREATE INDEX IF NOT EXISTS idx_veo_jobs_experiment_id ON veo_jobs(experiment_id);
CREATE INDEX IF NOT EXISTS idx_veo_jobs_campaign_id ON veo_jobs(campaign_id);

-- =========================
-- FUNCTIONS
-- =========================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_oauth_connections_updated_at BEFORE UPDATE ON oauth_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_publish_jobs_updated_at BEFORE UPDATE ON publish_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON veo_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON veo_experiments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

