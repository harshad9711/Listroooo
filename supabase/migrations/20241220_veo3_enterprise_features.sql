-- Veo 3 Enterprise Features Migration
-- RAG, Feature Flags, Job Cancellation, Observability

-- =========================
-- ENABLE PGVECTOR EXTENSION
-- =========================

CREATE EXTENSION IF NOT EXISTS vector;

-- =========================
-- KNOWLEDGE BASE DOCUMENTS
-- =========================

CREATE TABLE IF NOT EXISTS kb_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT CHECK (source IN ('upload', 'url', 'note')),
  mime_type TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_docs_org_id ON kb_docs(org_id);
CREATE INDEX idx_kb_docs_source ON kb_docs(source);
CREATE INDEX idx_kb_docs_created_at ON kb_docs(created_at);

-- RLS for knowledge base documents
ALTER TABLE kb_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's knowledge base docs" ON kb_docs
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's knowledge base docs" ON kb_docs
  FOR ALL USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =========================
-- KNOWLEDGE BASE CHUNKS WITH EMBEDDINGS
-- =========================

CREATE TABLE IF NOT EXISTS kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES kb_docs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  text TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_chunks_org_id ON kb_chunks(org_id);
CREATE INDEX idx_kb_chunks_doc_id ON kb_chunks(doc_id);
CREATE INDEX idx_kb_chunks_chunk_index ON kb_chunks(doc_id, chunk_index);

-- Vector similarity search index
CREATE INDEX idx_kb_chunks_embedding ON kb_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- RLS for knowledge base chunks
ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's knowledge base chunks" ON kb_chunks
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's knowledge base chunks" ON kb_chunks
  FOR ALL USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =========================
-- FEATURE FLAGS
-- =========================

CREATE TABLE IF NOT EXISTS feature_flags (
  org_id UUID PRIMARY KEY REFERENCES veo_organizations(id) ON DELETE CASCADE,
  flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_org_id ON feature_flags(org_id);
CREATE INDEX idx_feature_flags_updated_at ON feature_flags(updated_at);

-- RLS for feature flags
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's feature flags" ON feature_flags
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage their org's feature flags" ON feature_flags
  FOR ALL USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- =========================
-- JOB CANCELLATION
-- =========================

-- Add cancellation fields to existing veo_jobs table
ALTER TABLE veo_jobs ADD COLUMN IF NOT EXISTS cancelled BOOLEAN DEFAULT FALSE;
ALTER TABLE veo_jobs ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- Add indexes for cancellation queries
CREATE INDEX IF NOT EXISTS idx_veo_jobs_cancelled ON veo_jobs(cancelled);
CREATE INDEX IF NOT EXISTS idx_veo_jobs_status_cancelled ON veo_jobs(status, cancelled);

-- =========================
-- JOB TIMELINE EVENTS
-- =========================

CREATE TABLE IF NOT EXISTS veo_job_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES veo_jobs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'queued', 'start', 'poll', 'stored', 'thumbs', 'captioned', 'error', 'cancelled', 'completed'
  )),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_veo_job_events_job_id ON veo_job_events(job_id);
CREATE INDEX idx_veo_job_events_org_id ON veo_job_events(org_id);
CREATE INDEX idx_veo_job_events_event_type ON veo_job_events(event_type);
CREATE INDEX idx_veo_job_events_created_at ON veo_job_events(created_at);

-- RLS for job events
ALTER TABLE veo_job_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's job events" ON veo_job_events
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =========================
-- CIRCUIT BREAKER STATES
-- =========================

CREATE TABLE IF NOT EXISTS circuit_breaker_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breaker_name TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL CHECK (state IN ('closed', 'open', 'half-open')),
  failure_count INT DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_circuit_breaker_states_name ON circuit_breaker_states(breaker_name);
CREATE INDEX idx_circuit_breaker_states_state ON circuit_breaker_states(state);

-- =========================
-- COMPOSER CACHE METADATA
-- =========================

CREATE TABLE IF NOT EXISTS composer_cache_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES veo_organizations(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  hit_count INT DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_composer_cache_org_id ON composer_cache_metadata(org_id);
CREATE INDEX idx_composer_cache_key ON composer_cache_metadata(cache_key);
CREATE INDEX idx_composer_cache_last_accessed ON composer_cache_metadata(last_accessed_at);

-- RLS for composer cache metadata
ALTER TABLE composer_cache_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's cache metadata" ON composer_cache_metadata
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM veo_organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =========================
-- OBSERVABILITY METRICS
-- =========================

CREATE TABLE IF NOT EXISTS veo_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  labels JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_veo_metrics_name ON veo_metrics(metric_name);
CREATE INDEX idx_veo_metrics_timestamp ON veo_metrics(timestamp);
CREATE INDEX idx_veo_metrics_labels ON veo_metrics USING GIN(labels);

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
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_circuit_breaker_states_updated_at BEFORE UPDATE ON circuit_breaker_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old metrics (run via cron)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
    DELETE FROM veo_metrics WHERE timestamp < NOW() - INTERVAL '30 days';
    DELETE FROM veo_job_events WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ language 'plpgsql';

-- =========================
-- SAMPLE DATA
-- =========================

-- Insert default feature flags for existing organizations
INSERT INTO feature_flags (org_id, flags)
SELECT id, '{"composer_rag": true, "composer_cache": true, "breaker_veo": true}'::jsonb
FROM veo_organizations
WHERE id NOT IN (SELECT org_id FROM feature_flags);

-- =========================
-- COMMENTS
-- =========================

COMMENT ON TABLE kb_docs IS 'Knowledge base documents for RAG system';
COMMENT ON TABLE kb_chunks IS 'Chunked text with embeddings for vector search';
COMMENT ON TABLE feature_flags IS 'Feature flags per organization';
COMMENT ON TABLE veo_job_events IS 'Timeline events for job observability';
COMMENT ON TABLE circuit_breaker_states IS 'Circuit breaker state tracking';
COMMENT ON TABLE composer_cache_metadata IS 'Cache hit tracking for composer';
COMMENT ON TABLE veo_metrics IS 'Observability metrics storage';

