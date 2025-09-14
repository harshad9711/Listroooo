# Commerce & Attribution System

The Veo 3 Cinematic Generator now includes a complete **Commerce & Attribution loop** that turns products into video creatives with full performance tracking and optimization.

## 🎯 Overview

This system provides:
- **Product Integration**: Connect Shopify stores and sync products
- **AI Composition**: Automatically generate video prompts from product data
- **Attribution Tracking**: Track clicks, conversions, and revenue
- **Performance Analytics**: Measure CTR, CVR, and ROAS
- **Auto-Iteration**: Optimize creatives based on performance data

## 🚀 Quick Start

### 1. Environment Setup

Add these variables to your `.env` file:

```bash
# Commerce & Attribution
PUBLIC_BASE_URL=https://localhost:5173
SHOPIFY_CLIENT_ID=your_shopify_app_id
SHOPIFY_CLIENT_SECRET=your_shopify_app_secret
SHOPIFY_SCOPES=read_products,read_product_listings,read_files,write_files,read_price_rules
SHOPIFY_REDIRECT_URI=${PUBLIC_BASE_URL}/api/commerce/shopify/callback
LINK_DOMAIN=${PUBLIC_BASE_URL}
UTM_SOURCE_DEFAULT=veo3
PIXEL_VERIFY_SECRET=change-me
```

### 2. Install Dependencies

```bash
npm install @shopify/shopify-api nanoid dayjs
```

### 3. Run Database Migrations

```bash
# Apply the commerce migration
psql -d your_database -f supabase/migrations/20241220_veo3_commerce_attribution.sql
```

## 📊 Database Schema

### Stores Table
```sql
create table stores (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  provider text not null check (provider in ('shopify')),
  shop_domain text not null unique,
  access_token_enc text not null,
  installed_at timestamptz default now(),
  last_sync_at timestamptz
);
```

### Products & Variants
```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  store_id uuid not null references stores(id) on delete cascade,
  external_id text not null,
  handle text,
  title text not null,
  body_html text,
  vendor text,
  product_type text,
  tags text[],
  url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table product_variants (
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
```

### Attribution Tables
```sql
create table creative_product_map (
  id uuid primary key default gen_random_uuid(),
  veo_job_id uuid not null,
  product_id uuid not null,
  variant_id uuid,
  campaign text,
  cta text,
  seed int,
  short_id text unique,
  target_url text,
  created_at timestamptz default now()
);

create table attrib_clicks (
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

create table attrib_conversions (
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
```

## 🔗 API Endpoints

### Shopify Integration

#### Connect Store
```bash
GET /api/commerce/shopify/install?shop=your-store.myshopify.com
```

#### OAuth Callback
```bash
GET /api/commerce/shopify/callback?code=...&shop=...&state=...
```

#### Sync Products
```bash
POST /api/commerce/shopify/sync
{
  "storeId": "uuid"
}
```

#### List Stores
```bash
GET /api/commerce/shopify/stores
```

### Product Composition

#### Compose from Product
```bash
POST /api/veo3/composeFromProduct
{
  "productId": "uuid",
  "variantId": "uuid",
  "goal": "product awareness",
  "platform": "tiktok",
  "brandKitId": "uuid",
  "campaign": "summer_sale",
  "cta": "Shop now",
  "seed": 42
}
```

#### List Products
```bash
GET /api/veo3/products?storeId=uuid&limit=50&offset=0
```

### Attribution & Tracking

#### Create Tracked Link
```bash
POST /api/attrib/link
{
  "veoJobId": "uuid",
  "productId": "uuid",
  "variantId": "uuid",
  "campaign": "summer_sale",
  "cta": "Shop now",
  "seed": 42
}
```

#### Link Redirect (Public)
```bash
GET /l/{shortId}
```

#### Track Conversion (Public)
```bash
POST /api/attrib/convert
{
  "shortId": "abc123",
  "orderId": "order_456",
  "revenueCents": 2999,
  "currency": "USD",
  "verify": "hmac_signature"
}
```

#### Get Attribution Metrics
```bash
GET /api/attrib/metrics?veoJobId=uuid&productId=uuid&startDate=2024-01-01&endDate=2024-12-31
```

### Product Iteration

#### Create Iterations
```bash
POST /api/veo3/iterate
{
  "productId": "uuid",
  "baseJobId": "uuid",
  "strategy": "seed|cta|hook",
  "count": 3
}
```

## 🎨 UI Components

### Enhanced Studio Page

The `VeoStudioPageEnhanced.tsx` includes three main tabs:

#### 1. Compose Tab
- Traditional prompt builder
- Real-time validation
- Video generation
- Job status tracking

#### 2. Catalog Tab
- Store selection
- Product browsing
- Variant selection
- One-click composition from products

#### 3. Attribution Tab
- Performance metrics table
- CTR, CVR, Revenue tracking
- Tracked link management
- Iteration controls

## 🔄 Complete Workflow

### 1. Connect Shopify Store
```bash
# 1. Create Shopify app in Partner Dashboard
# 2. Set redirect URI: https://yourdomain.com/api/commerce/shopify/callback
# 3. Install app: GET /api/commerce/shopify/install?shop=store.myshopify.com
# 4. Complete OAuth flow
```

### 2. Sync Products
```bash
# Sync products from connected store
POST /api/commerce/shopify/sync
{
  "storeId": "store_uuid"
}
```

### 3. Compose Video from Product
```bash
# Generate video prompt from product
POST /api/veo3/composeFromProduct
{
  "productId": "product_uuid",
  "platform": "tiktok",
  "goal": "product awareness"
}
```

### 4. Generate Video
```bash
# Create video using composed prompt
POST /api/veo3/generate
{
  "idea": "Premium Wireless Headphones - Crystal clear sound...",
  "goal": "product awareness",
  "platform": "tiktok",
  "visualRefs": [...],
  "shotPlan": [...]
}
```

### 5. Create Tracked Link
```bash
# Generate short link with UTM tracking
POST /api/attrib/link
{
  "veoJobId": "job_uuid",
  "productId": "product_uuid",
  "campaign": "summer_sale"
}
```

### 6. Track Performance
```bash
# Monitor clicks and conversions
GET /api/attrib/metrics
```

### 7. Optimize & Iterate
```bash
# Create variations based on performance
POST /api/veo3/iterate
{
  "productId": "product_uuid",
  "strategy": "cta",
  "count": 3
}
```

## 📈 Attribution Metrics

### Key Metrics
- **CTR (Click-Through Rate)**: Clicks / Impressions
- **CVR (Conversion Rate)**: Conversions / Clicks
- **RPC (Revenue Per Click)**: Revenue / Clicks
- **ROAS (Return on Ad Spend)**: Revenue / Cost

### UTM Parameters
All tracked links include:
- `utm_source=veo3`
- `utm_medium=video`
- `utm_campaign=veo3_{campaign}`
- `utm_content=s{seed}`

## 🔒 Security Features

### Token Encryption
- Shopify access tokens are encrypted using AES-256-GCM
- Keys derived from Shopify client secret
- Never stored in plain text

### Webhook Verification
- HMAC-SHA256 signature verification
- Timestamp validation
- Replay attack protection

### Conversion Verification
- HMAC signature for conversion events
- Time-based validation
- Secure pixel implementation

## 🧪 Testing

### Test Shopify App Setup
1. Create development app in Shopify Partner Dashboard
2. Set redirect URI to your local development URL
3. Install app on development store
4. Test OAuth flow and product sync

### Test Attribution Flow
1. Create a product composition
2. Generate a video
3. Create a tracked link
4. Click the link to test redirect
5. Submit a test conversion
6. Verify metrics in attribution dashboard

## 🚀 Production Deployment

### Environment Variables
Ensure all commerce variables are set in production:
- `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`
- `PUBLIC_BASE_URL` for redirects and links
- `PIXEL_VERIFY_SECRET` for conversion security

### Database
Run migrations on production database:
```bash
psql -d production_db -f supabase/migrations/20241220_veo3_commerce_attribution.sql
```

### Shopify App
1. Submit app for review in Partner Dashboard
2. Set production redirect URI
3. Configure webhook endpoints
4. Test with live store

## 📚 Examples

### Complete Product-to-Video Flow

```javascript
// 1. Connect store
const installUrl = `/api/commerce/shopify/install?shop=my-store.myshopify.com`;
window.location.href = installUrl;

// 2. Sync products
const syncResponse = await fetch('/api/commerce/shopify/sync', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ storeId: 'store_uuid' })
});

// 3. Compose from product
const composeResponse = await fetch('/api/veo3/composeFromProduct', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    productId: 'product_uuid',
    platform: 'tiktok',
    goal: 'product awareness'
  })
});

const { json: prompt } = await composeResponse.json();

// 4. Generate video
const generateResponse = await fetch('/api/veo3/generate', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(prompt)
});

const { jobId } = await generateResponse.json();

// 5. Create tracked link
const linkResponse = await fetch('/api/attrib/link', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    veoJobId: jobId,
    productId: 'product_uuid',
    campaign: 'summer_sale'
  })
});

const { shortUrl } = await linkResponse.json();
console.log('Tracked link:', shortUrl);
```

This commerce and attribution system provides a complete end-to-end solution for turning products into high-performing video creatives with full performance tracking and optimization capabilities.

