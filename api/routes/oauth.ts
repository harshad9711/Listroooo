import { Router } from 'express';
import { 
  generateAuthUrl, 
  exchangeCodeForToken, 
  getUserInfo, 
  saveOAuthConnection,
  getOAuthConnections,
  deleteOAuthConnection,
  generateState,
  createStateJWT,
  verifyStateJWT,
  OAuthProvider
} from '../lib/oauth.js';
import pino from 'pino';

const logger = pino({ name: 'oauth-routes' });
const router = Router();

// =========================
// OAUTH INITIATION
// =========================

router.get('/:provider/connect', async (req, res) => {
  try {
    const { provider } = req.params;
    const { orgId } = req.query;

    if (!['tiktok', 'meta', 'youtube'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const state = generateState();
    const stateJWT = createStateJWT(state, orgId as string, provider as OAuthProvider);
    const authUrl = generateAuthUrl(provider as OAuthProvider, state);

    // Store state in cookie for verification
    res.cookie('oauth_state', stateJWT, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000 // 10 minutes
    });

    res.json({ authUrl });
  } catch (error) {
    logger.error({ error: error.message }, 'OAuth initiation failed');
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

// =========================
// OAUTH CALLBACKS
// =========================

router.get('/:provider/callback', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).json({ error: `OAuth error: ${error}` });
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing authorization code or state' });
    }

    // Verify state
    const stateCookie = req.cookies.oauth_state;
    if (!stateCookie) {
      return res.status(400).json({ error: 'Missing state cookie' });
    }

    const { orgId } = await verifyStateJWT(stateCookie);
    
    // Exchange code for token
    const token = await exchangeCodeForToken(provider as OAuthProvider, code as string);
    
    // Get user info
    const userInfo = await getUserInfo(provider as OAuthProvider, token.accessToken);
    
    // Save connection
    const connectionId = await saveOAuthConnection(orgId, req.user.id, provider as OAuthProvider, token, userInfo);

    // Clear state cookie
    res.clearCookie('oauth_state');

    // Redirect to success page
    res.redirect(`${process.env.PUBLIC_BASE_URL}/dashboard/connections?success=${provider}`);
  } catch (error) {
    logger.error({ error: error.message }, 'OAuth callback failed');
    res.redirect(`${process.env.PUBLIC_BASE_URL}/dashboard/connections?error=oauth_failed`);
  }
});

// =========================
// CONNECTION MANAGEMENT
// =========================

router.get('/connections', async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const connections = await getOAuthConnections(orgId as string);
    res.json(connections);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get OAuth connections');
    res.status(500).json({ error: 'Failed to get connections' });
  }
});

router.delete('/connections/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    await deleteOAuthConnection(orgId as string, connectionId);
    res.json({ success: true });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to delete OAuth connection');
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

// =========================
// PROVIDER-SPECIFIC ROUTES
// =========================

// TikTok specific routes
router.get('/tiktok/accounts', async (req, res) => {
  try {
    const { orgId } = req.query;
    const connection = await getOAuthConnection(orgId as string, 'tiktok');
    
    // Get TikTok accounts (if applicable)
    // This would call TikTok API to get available accounts
    res.json({ accounts: [] });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get TikTok accounts');
    res.status(500).json({ error: 'Failed to get TikTok accounts' });
  }
});

// Meta specific routes
router.get('/meta/pages', async (req, res) => {
  try {
    const { orgId } = req.query;
    const connection = await getOAuthConnection(orgId as string, 'meta');
    
    // Get Meta pages (if applicable)
    // This would call Meta API to get available pages
    res.json({ pages: [] });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get Meta pages');
    res.status(500).json({ error: 'Failed to get Meta pages' });
  }
});

// YouTube specific routes
router.get('/youtube/channels', async (req, res) => {
  try {
    const { orgId } = req.query;
    const connection = await getOAuthConnection(orgId as string, 'youtube');
    
    // Get YouTube channels (if applicable)
    // This would call YouTube API to get available channels
    res.json({ channels: [] });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get YouTube channels');
    res.status(500).json({ error: 'Failed to get YouTube channels' });
  }
});

export default router;

