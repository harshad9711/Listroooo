require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Sentry integration
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();
const PORT = process.env.PORT || 3001;

// Sentry request handler (must be first middleware)
app.use(Sentry.Handlers.requestHandler());

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'replace_this_with_a_real_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Mock data for development
// const mockUGCContent = [
//   {
//     id: 'ugc_1',
//     platform: 'instagram',
//     content_type: 'video',
//     author: {
//       username: 'user_123',
//       followers: 15000,
//       verified: true
//     },
//     content: {
//       url: 'https://example.com/video1.mp4',
//       thumbnail_url: 'https://picsum.photos/300/400?random=1',
//       duration: 30,
//       caption: 'Amazing product! #brand #lifestyle',
//       hashtags: ['brand', 'lifestyle', 'product'],
//       mentions: [],
//       location: 'New York, NY'
//     },
//     engagement: {
//       likes: 1200,
//       comments: 89,
//       shares: 156,
//       views: 50000,
//       reach: 250000
//     },
//     rights_status: 'pending',
//     brand_tags: ['brand', 'product'],
//     sentiment_score: 0.8,
//     quality_score: 8.5,
//     created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
//     discovered_at: new Date().toISOString()
//   },
//   {
//     id: 'ugc_2',
//     platform: 'tiktok',
//     content_type: 'video',
//     author: {
//       username: 'creator_456',
//       followers: 25000,
//       verified: false
//     },
//     content: {
//       url: 'https://example.com/video2.mp4',
//       thumbnail_url: 'https://picsum.photos/300/400?random=2',
//       duration: 45,
//       caption: 'Check out this incredible product! #brand #amazing',
//       hashtags: ['brand', 'amazing', 'product'],
//       mentions: [],
//       location: 'Los Angeles, CA'
//     },
//     engagement: {
//       likes: 2300,
//       comments: 145,
//       shares: 234,
//       views: 75000,
//       reach: 350000
//     },
//     rights_status: 'approved',
//     brand_tags: ['brand', 'product'],
//     sentiment_score: 0.9,
//     quality_score: 9.2,
//     created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
//     discovered_at: new Date().toISOString()
//   }
// ];

// const mockInboxItems = [
//   {
//     id: 'inbox_1',
//     content: mockUGCContent[0],
//     edits: [],
//     voiceovers: [],
//     hotspots: [],
//     status: 'new',
//     notes: '',
//     created_at: new Date().toISOString(),
//     updated_at: new Date().toISOString()
//   },
//   {
//     id: 'inbox_2',
//     content: mockUGCContent[1],
//     edits: [],
//     voiceovers: [],
//     hotspots: [],
//     status: 'approved',
//     notes: 'Great content, approved for use',
//     created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
//     updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
//   }
// ];

// In-memory mock analytics DB for feedback events
const mockFeedbackEvents = [];

// Shopify Integration (OAuth, Store Info, Products)
const axios = require('axios');
const querystring = require('querystring');
const { Pool } = require('pg');
const db = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
});

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES || 'read_products,read_orders,read_customers,read_inventory';
const SHOPIFY_REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3001/api/shopify/callback';

// Helper: get userId (replace with real auth in production)
function getUserId(req) {
  // For demo, use sessionID
  return req.sessionID;
}

// JWT authentication middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret', (err, user) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Protect all /api/ugc endpoints
app.use('/api/ugc', authenticateJWT);

// Routes

// GET /api/ugc/analytics
app.get('/api/ugc/analytics', async (req, res) => {
  try {
    // Get total content
    const totalContentResult = await db.query('SELECT COUNT(*) FROM ugc_content');
    const totalContent = parseInt(totalContentResult.rows[0].count, 10);

    // Get total inbox items
    const totalInboxItemsResult = await db.query('SELECT COUNT(*) FROM ugc_inbox');
    const totalInboxItems = parseInt(totalInboxItemsResult.rows[0].count, 10);

    // Get content by platform
    const contentByPlatformResult = await db.query('SELECT platform, COUNT(*) FROM ugc_content GROUP BY platform');
    const contentByPlatform = {};
    contentByPlatformResult.rows.forEach(row => {
      contentByPlatform[row.platform] = parseInt(row.count, 10);
    });

    // Get content by status
    const contentByStatusResult = await db.query('SELECT status, COUNT(*) FROM ugc_inbox GROUP BY status');
    const contentByStatus = {};
    contentByStatusResult.rows.forEach(row => {
      contentByStatus[row.status] = parseInt(row.count, 10);
    });

    // Get recent activity (last 2 discovered)
    const recentActivityResult = await db.query('SELECT * FROM ugc_content ORDER BY discovered_at DESC LIMIT 2');
    const recentActivity = recentActivityResult.rows.map(item => ({
      type: 'discovered',
      item,
      date: item.discovered_at
    }));

    // Placeholder for edits/voiceovers (if you add those tables later)
    const totalEdits = 5;
    const totalVoiceovers = 3;

    res.json({
      totalContent,
      totalInboxItems,
      totalEdits,
      totalVoiceovers,
      contentByPlatform,
      contentByStatus,
      recentActivity
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/ugc/inbox
app.get('/api/ugc/inbox', async (req, res) => {
  const { status } = req.query;
  try {
    let query = 'SELECT * FROM ugc_inbox';
    let params = [];
    if (status && status !== 'all') {
      query += ' WHERE status = $1';
      params.push(status);
    }
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inbox items' });
  }
});

// PUT /api/ugc/inbox/:id
app.put('/api/ugc/inbox/:id', async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  try {
    const result = await db.query(
      'UPDATE ugc_inbox SET status = $1, notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [status, notes, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Inbox item not found' });
    }
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update inbox item' });
  }
});

// POST /api/ugc/inbox
app.post('/api/ugc/inbox', async (req, res) => {
  const { contentId } = req.body;
  try {
    // Check if content exists
    const contentResult = await db.query('SELECT id FROM ugc_content WHERE id = $1', [contentId]);
    if (contentResult.rowCount === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    const result = await db.query(
      `INSERT INTO ugc_inbox (content_id, status, notes, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
      [contentId, 'new', '']
    );
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create inbox item' });
  }
});

// POST /api/ugc/discover
app.post('/api/ugc/discover', (req, res) => {
  const { hashtags, brandKeywords, platforms } = req.body;
  
  // Simulate content discovery
  const discoveredContent = [
    {
      id: 'discovered_1',
      platform: 'instagram',
      content_type: 'video',
      content_url: 'https://example.com/discovered1.mp4',
      thumbnail_url: 'https://picsum.photos/300/400?random=10',
      caption: 'Amazing product discovery! #brand #discovery',
      username: 'discovered_user',
      hashtags: ['brand', 'discovery', 'product'],
      status: 'pending',
      source: 'api',
      brand_mentions: ['brand', 'product'],
      sentiment_score: 0.85,
      quality_score: 8.8,
      created_at: new Date().toISOString(),
      discovered_at: new Date().toISOString()
    }
  ];
  
  res.json(discoveredContent);
});

// POST /api/ugc/edit
app.post('/api/ugc/edit', (req, res) => {
  const { contentId, brandGuidelines } = req.body;
  
  const edit = {
    id: `edit_${Date.now()}`,
    content_id: contentId,
    edit_type: 'auto',
    changes: brandGuidelines,
    status: 'processing',
    created_at: new Date().toISOString()
  };
  
  // Simulate processing
  setTimeout(() => {
    edit.status = 'completed';
    edit.output_url = `https://processed-content.com/${edit.id}.mp4`;
    edit.completed_at = new Date().toISOString();
  }, 2000);
  
  res.json(edit);
});

// GET /api/ugc/edit/:contentId
app.get('/api/ugc/edit/:contentId', (req, res) => {
  const { contentId } = req.params;
  
  const edits = [
    {
      id: `edit_${contentId}_1`,
      content_id: contentId,
      edit_type: 'auto',
      changes: {
        filter: 'vintage',
        brightness: 1.1,
        contrast: 1.05
      },
      status: 'completed',
      output_url: `https://processed-content.com/${contentId}_edit.mp4`,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  res.json(edits);
});

// POST /api/ugc/voiceover
app.post('/api/ugc/voiceover', (req, res) => {
  const { contentId, script, voiceType } = req.body;
  
  const voiceover = {
    id: `voiceover_${Date.now()}`,
    content_id: contentId,
    voice_type: voiceType || 'neutral',
    language: 'en',
    script: script || 'Check out this amazing content!',
    status: 'generating',
    created_at: new Date().toISOString()
  };
  
  // Simulate generation
  setTimeout(() => {
    voiceover.status = 'completed';
    voiceover.audio_url = `https://voiceover-service.com/${voiceover.id}.mp3`;
    voiceover.duration = 15.5;
    voiceover.completed_at = new Date().toISOString();
  }, 3000);
  
  res.json(voiceover);
});

// GET /api/ugc/voiceover/:contentId
app.get('/api/ugc/voiceover/:contentId', (req, res) => {
  const { contentId } = req.params;
  
  const voiceovers = [
    {
      id: `voiceover_${contentId}_1`,
      content_id: contentId,
      voice_type: 'energetic',
      language: 'en',
      script: 'Check out this amazing content!',
      status: 'completed',
      audio_url: `https://voiceover-service.com/${contentId}_voiceover.mp3`,
      duration: 15.5,
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  res.json(voiceovers);
});

// POST /api/ugc/hotspots
app.post('/api/ugc/hotspots', (req, res) => {
  const { contentId } = req.body;
  
  const hotspots = [
    {
      id: `hotspot_${Date.now()}_1`,
      content_id: contentId,
      hotspot_type: 'product',
      position: { x: 200, y: 300 },
      size: { width: 120, height: 80 },
      data: {
        product_id: 'prod_1',
        product_name: 'Premium T-Shirt',
        product_price: 29.99,
        product_url: '/product/premium-tshirt'
      },
      created_at: new Date().toISOString()
    },
    {
      id: `hotspot_${Date.now()}_2`,
      content_id: contentId,
      hotspot_type: 'cta',
      position: { x: 400, y: 500 },
      size: { width: 150, height: 50 },
      data: {
        title: 'Shop Now',
        description: 'Click to explore products',
        cta_text: 'Shop Now'
      },
      created_at: new Date().toISOString()
    }
  ];
  
  res.json(hotspots);
});

// GET /api/ugc/hotspots/:contentId
app.get('/api/ugc/hotspots/:contentId', (req, res) => {
  const { contentId } = req.params;
  
  const hotspots = [
    {
      id: `hotspot_${contentId}_1`,
      content_id: contentId,
      hotspot_type: 'product',
      position: { x: 200, y: 300 },
      size: { width: 120, height: 80 },
      data: {
        product_id: 'prod_1',
        product_name: 'Premium T-Shirt',
        product_price: 29.99,
        product_url: '/product/premium-tshirt'
      },
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  res.json(hotspots);
});

// Rights management endpoints
app.post('/api/ugc/rights/request', (req, res) => {
  const { contentId, brandId, terms } = req.body;
  
  res.json({
    success: true,
    message: 'Rights request submitted successfully. You will be notified when the creator responds.'
  });
});

app.get('/api/ugc/rights/status/:contentId', (req, res) => {
  const { contentId } = req.params;
  
  res.json({ status: 'pending' });
});

app.post('/api/ugc/rights/approve', (req, res) => {
  const { contentId } = req.body;
  
  res.json({
    success: true,
    message: 'Rights approved successfully'
  });
});

// POST /api/ugc/feedback
app.post('/api/ugc/feedback', (req, res) => {
  const { rating, comment, userId, contentId, context } = req.body;
  const event = {
    id: `feedback_${Date.now()}`,
    rating, // 'up' | 'down'
    comment: comment || '',
    userId: userId || null,
    contentId: contentId || null,
    context: context || {},
    timestamp: new Date().toISOString()
  };
  // Log to analytics DB (mocked as array for now)
  mockFeedbackEvents.push(event);
  // TODO: Wire this to your real analytics DB (e.g., Supabase, BigQuery, etc.)
  res.json({ success: true, event });
});

// 1. Start OAuth
app.get('/api/shopify/auth', (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send('Missing shop parameter');
  const state = Math.random().toString(36).substring(2);
  req.session.shopifyState = state;
  const installUrl = `https://${shop}/admin/oauth/authorize?` +
    querystring.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      scope: process.env.SHOPIFY_SCOPES,
      redirect_uri: process.env.SHOPIFY_REDIRECT_URI,
      state,
    });
  res.redirect(installUrl);
});

// 2. OAuth Callback
app.get('/api/shopify/callback', async (req, res) => {
  const { shop, code, state } = req.query;
  if (!shop || !code || !state) return res.status(400).send('Missing shop, code, or state');
  if (state !== req.session.shopifyState) return res.status(403).send('Invalid state parameter');
  try {
    const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    });
    const accessToken = tokenRes.data.access_token;
    // Store token in session (or DB for production)
    req.session.shop = shop;
    req.session.accessToken = accessToken;
    res.redirect('/integrations?shop=connected');
  } catch (err) {
    res.status(500).send('Failed to get access token');
  }
});

// 3. Get Store Info
app.get('/api/shopify/store', async (req, res) => {
  const { shop, accessToken } = req.session;
  if (!shop || !accessToken) return res.status(401).json({ error: 'Not connected' });
  try {
    const storeRes = await axios.get(`https://${shop}/admin/api/2023-10/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });
    res.json(storeRes.data.shop);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch store info' });
  }
});

// 4. Get Products
app.get('/api/shopify/products', async (req, res) => {
  const { shop, accessToken } = req.session;
  if (!shop || !accessToken) return res.status(401).json({ error: 'Not connected' });
  try {
    const productsRes = await axios.get(`https://${shop}/admin/api/2023-10/products.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });
    res.json(productsRes.data.products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 5. Get Orders
app.get('/api/shopify/orders', async (req, res) => {
  const { shop, accessToken } = req.session;
  if (!shop || !accessToken) return res.status(401).json({ error: 'Not connected' });
  try {
    const ordersRes = await axios.get(`https://${shop}/admin/api/2023-10/orders.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });
    res.json(ordersRes.data.orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Registration endpoint
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, hashedPassword]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET || 'dev_jwt_secret', { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Sentry error handler (must be after all routes)
app.use(Sentry.Handlers.errorHandler());

// Start server
app.listen(PORT, () => {
  console.log(`UGC API Server running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /api/ugc/analytics`);
  console.log(`  GET  /api/ugc/inbox`);
  console.log(`  PUT  /api/ugc/inbox/:id`);
  console.log(`  POST /api/ugc/inbox`);
  console.log(`  POST /api/ugc/discover`);
  console.log(`  POST /api/ugc/edit`);
  console.log(`  GET  /api/ugc/edit/:contentId`);
  console.log(`  POST /api/ugc/voiceover`);
  console.log(`  GET  /api/ugc/voiceover/:contentId`);
  console.log(`  POST /api/ugc/hotspots`);
  console.log(`  GET  /api/ugc/hotspots/:contentId`);
  console.log(`  POST /api/ugc/rights/request`);
  console.log(`  GET  /api/ugc/rights/status/:contentId`);
  console.log(`  POST /api/ugc/rights/approve`);
  console.log(`  POST /api/ugc/feedback`);
  console.log(`  GET  /api/shopify/auth`);
  console.log(`  GET  /api/shopify/callback`);
  console.log(`  GET  /api/shopify/store`);
  console.log(`  GET  /api/shopify/products`);
  console.log(`  GET  /api/shopify/orders`);
});

module.exports = app; 