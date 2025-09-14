import { createClient } from '@supabase/supabase-js';
import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'crypto';
import pino from 'pino';

const logger = pino({ name: 'oauth' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export type OAuthProvider = 'tiktok' | 'meta' | 'youtube';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

export interface OAuthUser {
  id: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  email?: string;
}

// =========================
// OAUTH CONFIGURATIONS
// =========================

const OAUTH_CONFIGS: Record<OAuthProvider, OAuthConfig> = {
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_ID!,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
    redirectUri: `${process.env.PUBLIC_BASE_URL}/api/oauth/tiktok/callback`,
    scope: ['user.info.basic', 'video.publish'],
    authUrl: 'https://www.tiktok.com/v2/auth/authorize',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token',
    userInfoUrl: 'https://open.tiktokapis.com/v2/user/info'
  },
  meta: {
    clientId: process.env.META_APP_ID!,
    clientSecret: process.env.META_APP_SECRET!,
    redirectUri: `${process.env.PUBLIC_BASE_URL}/api/oauth/meta/callback`,
    scope: ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic'],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/v18.0/me'
  },
  youtube: {
    clientId: process.env.YT_CLIENT_ID!,
    clientSecret: process.env.YT_CLIENT_SECRET!,
    redirectUri: `${process.env.PUBLIC_BASE_URL}/api/oauth/youtube/callback`,
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
  }
};

// =========================
// ENCRYPTION HELPERS
// =========================

function encryptToken(token: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.OAUTH_ENCRYPTION_KEY!, 'hex');
  const iv = randomBytes(16);
  
  const cipher = require('crypto').createCipher(algorithm, key);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decryptToken(encryptedToken: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.OAUTH_ENCRYPTION_KEY!, 'hex');
  const [ivHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = require('crypto').createDecipher(algorithm, key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// =========================
// OAUTH FLOW
// =========================

export function generateAuthUrl(provider: OAuthProvider, state: string): string {
  const config = OAUTH_CONFIGS[provider];
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope.join(' '),
    response_type: 'code',
    state: state
  });

  // Add provider-specific parameters
  if (provider === 'youtube') {
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
  }

  return `${config.authUrl}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  provider: OAuthProvider, 
  code: string
): Promise<OAuthToken> {
  const config = OAUTH_CONFIGS[provider];
  
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    scope: data.scope
  };
}

export async function refreshAccessToken(
  provider: OAuthProvider,
  refreshToken: string
): Promise<OAuthToken> {
  const config = OAUTH_CONFIGS[provider];
  
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    scope: data.scope
  };
}

export async function getUserInfo(
  provider: OAuthProvider,
  accessToken: string
): Promise<OAuthUser> {
  const config = OAUTH_CONFIGS[provider];
  
  const response = await fetch(config.userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`User info fetch failed: ${error}`);
  }

  const data = await response.json();
  
  // Normalize user data across providers
  switch (provider) {
    case 'tiktok':
      return {
        id: data.data.user.id,
        username: data.data.user.username,
        displayName: data.data.user.display_name,
        profilePicture: data.data.user.avatar_url
      };
    case 'meta':
      return {
        id: data.id,
        username: data.name,
        displayName: data.name,
        profilePicture: data.picture?.data?.url,
        email: data.email
      };
    case 'youtube':
      return {
        id: data.id,
        username: data.email,
        displayName: data.name,
        profilePicture: data.picture,
        email: data.email
      };
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// =========================
// DATABASE OPERATIONS
// =========================

export async function saveOAuthConnection(
  orgId: string,
  userId: string,
  provider: OAuthProvider,
  token: OAuthToken,
  userInfo: OAuthUser
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('oauth_connections')
      .insert({
        org_id: orgId,
        user_id: userId,
        provider: provider,
        account_name: userInfo.displayName,
        access_token_enc: encryptToken(token.accessToken),
        refresh_token_enc: token.refreshToken ? encryptToken(token.refreshToken) : null,
        expires_at: token.expiresAt?.toISOString(),
        scope: token.scope
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save OAuth connection: ${error.message}`);
    }

    logger.info({ orgId, userId, provider, connectionId: data.id }, 'OAuth connection saved');
    return data.id;
  } catch (error) {
    logger.error({ orgId, userId, provider, error: error.message }, 'Failed to save OAuth connection');
    throw error;
  }
}

export async function getOAuthConnections(orgId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('oauth_connections')
      .select('id, provider, account_name, expires_at, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get OAuth connections: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error({ orgId, error: error.message }, 'Failed to get OAuth connections');
    throw error;
  }
}

export async function getOAuthConnection(
  orgId: string,
  provider: OAuthProvider
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('oauth_connections')
      .select('*')
      .eq('org_id', orgId)
      .eq('provider', provider)
      .single();

    if (error) {
      throw new Error(`OAuth connection not found: ${error.message}`);
    }

    // Decrypt tokens
    return {
      ...data,
      access_token: decryptToken(data.access_token_enc),
      refresh_token: data.refresh_token_enc ? decryptToken(data.refresh_token_enc) : null
    };
  } catch (error) {
    logger.error({ orgId, provider, error: error.message }, 'Failed to get OAuth connection');
    throw error;
  }
}

export async function refreshOAuthConnection(orgId: string, provider: OAuthProvider): Promise<void> {
  try {
    const connection = await getOAuthConnection(orgId, provider);
    
    if (!connection.refresh_token) {
      throw new Error('No refresh token available');
    }

    const newToken = await refreshAccessToken(provider, connection.refresh_token);
    
    await supabase
      .from('oauth_connections')
      .update({
        access_token_enc: encryptToken(newToken.accessToken),
        refresh_token_enc: newToken.refreshToken ? encryptToken(newToken.refreshToken) : connection.refresh_token_enc,
        expires_at: newToken.expiresAt?.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('org_id', orgId)
      .eq('provider', provider);

    logger.info({ orgId, provider }, 'OAuth connection refreshed');
  } catch (error) {
    logger.error({ orgId, provider, error: error.message }, 'Failed to refresh OAuth connection');
    throw error;
  }
}

export async function deleteOAuthConnection(orgId: string, connectionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('oauth_connections')
      .delete()
      .eq('id', connectionId)
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to delete OAuth connection: ${error.message}`);
    }

    logger.info({ orgId, connectionId }, 'OAuth connection deleted');
  } catch (error) {
    logger.error({ orgId, connectionId, error: error.message }, 'Failed to delete OAuth connection');
    throw error;
  }
}

// =========================
// STATE MANAGEMENT
// =========================

export function generateState(): string {
  return randomBytes(32).toString('hex');
}

export function createStateJWT(state: string, orgId: string, provider: OAuthProvider): string {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  
  return new SignJWT({ state, orgId, provider })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(secret);
}

export async function verifyStateJWT(token: string): Promise<{ state: string; orgId: string; provider: OAuthProvider }> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  
  const { payload } = await jwtVerify(token, secret);
  
  return {
    state: payload.state as string,
    orgId: payload.orgId as string,
    provider: payload.provider as OAuthProvider
  };
}

// =========================
// EXPORTS
// =========================

export { OAUTH_CONFIGS };

