-- =========================
-- COMMERCE & ATTRIBUTION MIGRATION
-- =========================

-- Stores + tokens
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  provider text not null check (provider in ('shopify')),
  shop_domain text not null unique,
  access_token_enc text not null,
  installed_at timestamptz default now(),
  last_sync_at timestamptz
);

-- Products, variants, media (normalized minimal)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  store_id uuid not null references stores(id) on delete cascade,
  external_id text not null,                 -- Shopify product id
  handle text,
  title text not null,
  body_html text,
  vendor text,
  product_type text,
  tags text[],
  url text,                                  -- storefront URL
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists uq_products_external on products(org_id, external_id);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  external_id text not null,
  title text,
  price_cents int,
  compare_at_cents int,
  sku text,
  available boolean,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists uq_variants_external on product_variants(product_id, external_id);

create table if not exists product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  url text not null,
  mime_type text,
  alt text,
  created_at timestamptz default now()
);

-- Mapping creatives to products + UTMs
create table if not exists creative_product_map (
  id uuid primary key default gen_random_uuid(),
  veo_job_id uuid not null,
  product_id uuid not null,
  variant_id uuid,
  campaign text,
  cta text,
  seed int,
  short_id text unique,                 -- short link id
  target_url text,                      -- full long URL with UTM
  created_at timestamptz default now()
);

-- Clicks & conversions
create table if not exists attrib_clicks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  short_id text not null,
  veo_job_id uuid,
  product_id uuid,
  ip inet,
  ua text,
  referrer text,
  ts timestamptz default now()
);
create index if not exists idx_clicks_short on attrib_clicks(short_id);

create table if not exists attrib_conversions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  short_id text,
  veo_job_id uuid,
  product_id uuid,
  order_external_id text,
  revenue_cents int,
  currency text default 'USD',
  ts timestamptz default now()
);

-- RLS Policies
alter table stores enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_media enable row level security;
alter table creative_product_map enable row level security;
alter table attrib_clicks enable row level security;
alter table attrib_conversions enable row level security;

-- Stores policies
create policy "Users can view stores for their org" on stores
  for select using (org_id = auth.jwt() ->> 'org_id'::text);

create policy "Users can insert stores for their org" on stores
  for insert with check (org_id = auth.jwt() ->> 'org_id'::text);

create policy "Users can update stores for their org" on stores
  for update using (org_id = auth.jwt() ->> 'org_id'::text);

-- Products policies
create policy "Users can view products for their org" on products
  for select using (org_id = auth.jwt() ->> 'org_id'::text);

create policy "Users can insert products for their org" on products
  for insert with check (org_id = auth.jwt() ->> 'org_id'::text);

create policy "Users can update products for their org" on products
  for update using (org_id = auth.jwt() ->> 'org_id'::text);

-- Product variants policies
create policy "Users can view variants for their org products" on product_variants
  for select using (product_id in (
    select id from products where org_id = auth.jwt() ->> 'org_id'::text
  ));

create policy "Users can insert variants for their org products" on product_variants
  for insert with check (product_id in (
    select id from products where org_id = auth.jwt() ->> 'org_id'::text
  ));

create policy "Users can update variants for their org products" on product_variants
  for update using (product_id in (
    select id from products where org_id = auth.jwt() ->> 'org_id'::text
  ));

-- Product media policies
create policy "Users can view media for their org products" on product_media
  for select using (product_id in (
    select id from products where org_id = auth.jwt() ->> 'org_id'::text
  ));

create policy "Users can insert media for their org products" on product_media
  for insert with check (product_id in (
    select id from products where org_id = auth.jwt() ->> 'org_id'::text
  ));

-- Creative product map policies
create policy "Users can view mappings for their org" on creative_product_map
  for select using (product_id in (
    select id from products where org_id = auth.jwt() ->> 'org_id'::text
  ));

create policy "Users can insert mappings for their org" on creative_product_map
  for insert with check (product_id in (
    select id from products where org_id = auth.jwt() ->> 'org_id'::text
  ));

-- Attribution clicks policies (public read for tracking)
create policy "Anyone can insert clicks" on attrib_clicks
  for insert with check (true);

create policy "Users can view clicks for their org" on attrib_clicks
  for select using (org_id = auth.jwt() ->> 'org_id'::text);

-- Attribution conversions policies (public insert for pixel)
create policy "Anyone can insert conversions" on attrib_conversions
  for insert with check (true);

create policy "Users can view conversions for their org" on attrib_conversions
  for select using (org_id = auth.jwt() ->> 'org_id'::text);

