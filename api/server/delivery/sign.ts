/**
 * JWT Signing for Stream Access
 * Handles JWT generation and verification for HLS stream access
 */

import jwt from 'jsonwebtoken';
import pino from 'pino';

const logger = pino({ name: 'stream-signing' });

// =========================
// TYPES
// =========================

export interface StreamTokenPayload {
  sub: string; // jobId
  type: 'stream_access';
  exp: number;
  iat: number;
  orgId?: string;
  userId?: string;
}

export interface StreamAccessResult {
  valid: boolean;
  jobId?: string;
  orgId?: string;
  userId?: string;
  error?: string;
}

// =========================
// TOKEN GENERATION
// =========================

export function generateStreamToken(
  jobId: string,
  expiresIn: number = 3600,
  orgId?: string,
  userId?: string
): string {
  try {
    const payload: StreamTokenPayload = {
      sub: jobId,
      type: 'stream_access',
      exp: Math.floor(Date.now() / 1000) + expiresIn,
      iat: Math.floor(Date.now() / 1000),
      orgId,
      userId
    };

    const token = jwt.sign(payload, process.env.SIGNING_SECRET!, {
      algorithm: 'HS256'
    });

    logger.info({ jobId, expiresIn }, 'Stream token generated');

    return token;

  } catch (error) {
    logger.error({ error: error.message, jobId }, 'Failed to generate stream token');
    throw new Error('Failed to generate stream token');
  }
}

// =========================
// TOKEN VERIFICATION
// =========================

export function verifyStreamToken(token: string): StreamAccessResult {
  try {
    const decoded = jwt.verify(token, process.env.SIGNING_SECRET!, {
      algorithms: ['HS256']
    }) as StreamTokenPayload;

    // Validate token type
    if (decoded.type !== 'stream_access') {
      return {
        valid: false,
        error: 'Invalid token type'
      };
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return {
        valid: false,
        error: 'Token expired'
      };
    }

    logger.info({ jobId: decoded.sub }, 'Stream token verified');

    return {
      valid: true,
      jobId: decoded.sub,
      orgId: decoded.orgId,
      userId: decoded.userId
    };

  } catch (error) {
    logger.warn({ error: error.message }, 'Stream token verification failed');
    
    return {
      valid: false,
      error: 'Invalid token'
    };
  }
}

// =========================
// TOKEN VALIDATION HELPERS
// =========================

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as StreamTokenPayload;
    if (!decoded || !decoded.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (error) {
    return true;
  }
}

export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as StreamTokenPayload;
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}

export function getTokenJobId(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as StreamTokenPayload;
    return decoded?.sub || null;
  } catch (error) {
    return null;
  }
}

// =========================
// BATCH TOKEN GENERATION
// =========================

export function generateBatchStreamTokens(
  jobIds: string[],
  expiresIn: number = 3600,
  orgId?: string,
  userId?: string
): Record<string, string> {
  const tokens: Record<string, string> = {};

  for (const jobId of jobIds) {
    try {
      tokens[jobId] = generateStreamToken(jobId, expiresIn, orgId, userId);
    } catch (error) {
      logger.error({ error: error.message, jobId }, 'Failed to generate token for job');
    }
  }

  return tokens;
}

// =========================
// TOKEN REFRESH
// =========================

export function refreshStreamToken(
  token: string,
  expiresIn: number = 3600
): string | null {
  try {
    const decoded = jwt.decode(token) as StreamTokenPayload;
    if (!decoded || !decoded.sub) return null;

    return generateStreamToken(decoded.sub, expiresIn, decoded.orgId, decoded.userId);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to refresh stream token');
    return null;
  }
}

// =========================
// SECURITY HELPERS
// =========================

export function validateTokenSecurity(token: string, expectedJobId: string): boolean {
  const verification = verifyStreamToken(token);
  
  if (!verification.valid) return false;
  if (verification.jobId !== expectedJobId) return false;
  
  return true;
}

export function createShortLivedMasterUrl(
  jobId: string,
  baseUrl: string = process.env.PUBLIC_BASE_URL || 'http://localhost:3001'
): string {
  const token = generateStreamToken(jobId, 3600); // 1 hour
  return `${baseUrl}/stream/veo/${jobId}/master.m3u8?token=${token}`;
}

// =========================
// TOKEN ANALYTICS
// =========================

export function getTokenInfo(token: string): {
  jobId: string | null;
  orgId: string | null;
  userId: string | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
  isValid: boolean;
  error?: string;
} {
  try {
    const decoded = jwt.decode(token) as StreamTokenPayload;
    
    if (!decoded) {
      return {
        jobId: null,
        orgId: null,
        userId: null,
        issuedAt: null,
        expiresAt: null,
        isValid: false,
        error: 'Invalid token format'
      };
    }

    const verification = verifyStreamToken(token);

    return {
      jobId: decoded.sub,
      orgId: decoded.orgId || null,
      userId: decoded.userId || null,
      issuedAt: new Date(decoded.iat * 1000),
      expiresAt: new Date(decoded.exp * 1000),
      isValid: verification.valid,
      error: verification.error
    };

  } catch (error) {
    return {
      jobId: null,
      orgId: null,
      userId: null,
      issuedAt: null,
      expiresAt: null,
      isValid: false,
      error: error.message
    };
  }
}

