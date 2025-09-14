-- Create veo_jobs table for Veo 3 video generation jobs
create table if not exists veo_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  idempotency_key text,
  idea_hash text,
  status text not null default 'queued', -- queued|running|done|error
  platform text not null,
  aspect text not null,
  resolution text not null,
  prompt_string text not null,
  config jsonb not null,
  asset_refs jsonb not null,
  operation_name text,
  output_url text,
  error_message text,
  progress int default 0,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Create unique index for idempotency
create unique index if not exists uq_veo_jobs_user_key_hash
  on veo_jobs (user_id, coalesce(idempotency_key,''), coalesce(idea_hash,''));

-- Create index for user queries
create index if not exists idx_veo_jobs_user_id on veo_jobs (user_id);
create index if not exists idx_veo_jobs_status on veo_jobs (status);
create index if not exists idx_veo_jobs_created_at on veo_jobs (created_at);

-- Enable RLS
alter table veo_jobs enable row level security;

-- Create RLS policy: users can only see their own jobs
create policy "Users can view their own veo jobs" on veo_jobs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own veo jobs" on veo_jobs
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own veo jobs" on veo_jobs
  for update using (auth.uid() = user_id);

-- Create storage bucket for rendered videos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'renders',
  'renders',
  false,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo']
) on conflict (id) do nothing;

-- Create storage policy for renders bucket
create policy "Users can upload their own renders" on storage.objects
  for insert with check (
    bucket_id = 'renders' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own renders" on storage.objects
  for select using (
    bucket_id = 'renders' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );
