-- =========================
-- PRODUCTION FEATURES MIGRATION
-- =========================

-- Add quality scoring columns to veo_jobs
alter table if exists veo_jobs
  add column quality_score numeric,
  add column quality_detail jsonb,
  add column model_used text,
  add column hls_master_url text,
  add column sprites_image_url text,
  add column sprites_vtt_url text,
  add column archived boolean default false,
  add column archived_at timestamptz;

-- Add queue statistics table
create table if not exists queue_stats (
  id uuid primary key default gen_random_uuid(),
  queue_name text not null,
  active_count int default 0,
  waiting_count int default 0,
  completed_count int default 0,
  failed_count int default 0,
  dlq_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add model orchestration metrics
create table if not exists model_metrics (
  id uuid primary key default gen_random_uuid(),
  model_name text not null,
  job_id uuid references veo_jobs(id),
  latency_ms int,
  success boolean,
  fallback_used boolean default false,
  cost_preference text,
  created_at timestamptz default now()
);

-- Add GDPR export tracking
create table if not exists gdpr_exports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  user_id uuid not null,
  export_token text unique not null,
  expires_at timestamptz not null,
  status text not null default 'pending', -- pending, completed, expired
  file_url text,
  created_at timestamptz default now()
);

-- Add GDPR deletion tracking
create table if not exists gdpr_deletions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  user_id uuid not null,
  scope text not null check (scope in ('user', 'org')),
  status text not null default 'pending', -- pending, processing, completed, failed
  jobs_deleted int default 0,
  assets_deleted int default 0,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Add monitoring ping tracking
create table if not exists monitoring_pings (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  response_time_ms int,
  status_code int,
  success boolean,
  error_message text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Add indexes for performance
create index if not exists idx_veo_jobs_quality on veo_jobs(quality_score);
create index if not exists idx_veo_jobs_archived on veo_jobs(archived, archived_at);
create index if not exists idx_model_metrics_model on model_metrics(model_name, created_at);
create index if not exists idx_gdpr_exports_token on gdpr_exports(export_token);
create index if not exists idx_gdpr_exports_expires on gdpr_exports(expires_at);
create index if not exists idx_monitoring_pings_endpoint on monitoring_pings(endpoint, created_at);

-- RLS Policies
alter table queue_stats enable row level security;
alter table model_metrics enable row level security;
alter table gdpr_exports enable row level security;
alter table gdpr_deletions enable row level security;
alter table monitoring_pings enable row level security;

-- Queue stats policies (admin only)
create policy "Admins can view queue stats" on queue_stats
  for select using (auth.jwt() ->> 'role' = 'admin');

-- Model metrics policies
create policy "Users can view model metrics for their org" on model_metrics
  for select using (job_id in (
    select id from veo_jobs where user_id = auth.jwt() ->> 'user_id'::text
  ));

-- GDPR exports policies
create policy "Users can view their own exports" on gdpr_exports
  for select using (user_id = auth.jwt() ->> 'user_id'::text);

create policy "Users can create exports for their org" on gdpr_exports
  for insert with check (org_id = auth.jwt() ->> 'org_id'::text and user_id = auth.jwt() ->> 'user_id'::text);

-- GDPR deletions policies
create policy "Users can view their own deletions" on gdpr_deletions
  for select using (user_id = auth.jwt() ->> 'user_id'::text);

create policy "Users can create deletions for their org" on gdpr_deletions
  for insert with check (org_id = auth.jwt() ->> 'org_id'::text and user_id = auth.jwt() ->> 'user_id'::text);

-- Monitoring pings policies (public for health checks)
create policy "Anyone can insert monitoring pings" on monitoring_pings
  for insert with check (true);

create policy "Admins can view monitoring pings" on monitoring_pings
  for select using (auth.jwt() ->> 'role' = 'admin');

-- Update veo_jobs RLS to include new columns
create policy "Users can update their own jobs quality data" on veo_jobs
  for update using (user_id = auth.jwt() ->> 'user_id'::text);

-- Create function to clean up expired GDPR exports
create or replace function cleanup_expired_gdpr_exports()
returns void as $$
begin
  delete from gdpr_exports 
  where expires_at < now() 
  and status = 'completed';
end;
$$ language plpgsql;

-- Create function to archive old jobs
create or replace function archive_old_jobs()
returns void as $$
begin
  update veo_jobs 
  set archived = true, archived_at = now()
  where created_at < now() - interval '90 days'
  and archived = false
  and share_token is null;
end;
$$ language plpgsql;

-- Create function to get queue health
create or replace function get_queue_health()
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'timestamp', now(),
    'queues', (
      select json_agg(
        json_build_object(
          'name', queue_name,
          'active', active_count,
          'waiting', waiting_count,
          'completed', completed_count,
          'failed', failed_count,
          'dlq', dlq_count
        )
      )
      from queue_stats
      where updated_at > now() - interval '5 minutes'
    )
  ) into result;
  
  return coalesce(result, '{"timestamp": "' || now() || '", "queues": []}');
end;
$$ language plpgsql;