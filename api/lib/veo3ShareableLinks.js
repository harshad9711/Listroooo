import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key'
);

/**
 * Create a shareable link for a video
 */
export async function createShareableLink(userId, jobId, options = {}) {
  try {
    const {
      expiresInHours = 24,
      allowDownload = true,
      allowEmbed = false,
      password = null
    } = options;

    // Verify job exists and belongs to user
    const { data: job, error: jobError } = await supabase
      .from('veo_jobs')
      .select('id, status, output_url')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'done' || !job.output_url) {
      throw new Error('Video not ready for sharing');
    }

    // Generate unique token
    const token = generateShareToken();
    const expiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000));

    // Create shareable link record
    const { data: link, error: linkError } = await supabase
      .from('veo_shareable_links')
      .insert({
        job_id: jobId,
        user_id: userId,
        token: token,
        expires_at: expiresAt.toISOString(),
        access_count: 0
      })
      .select()
      .single();

    if (linkError) {
      throw new Error(`Failed to create shareable link: ${linkError.message}`);
    }

    // Update job with shareable token
    await supabase
      .from('veo_jobs')
      .update({ shareable_token: token })
      .eq('id', jobId);

    // Generate shareable URL
    const baseUrl = process.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || 'http://localhost:3000';
    const shareableUrl = `${baseUrl}/share/${token}`;

    return {
      id: link.id,
      token: link.token,
      url: shareableUrl,
      expiresAt: link.expires_at,
      allowDownload,
      allowEmbed,
      password: password ? hashPassword(password) : null
    };

  } catch (error) {
    console.error('Create shareable link error:', error);
    throw error;
  }
}

/**
 * Get shareable link by token
 */
export async function getShareableLink(token) {
  try {
    const { data: link, error } = await supabase
      .from('veo_shareable_links')
      .select(`
        *,
        veo_jobs(
          id,
          status,
          output_url,
          platform,
          aspect,
          resolution,
          created_at,
          completed_at
        )
      `)
      .eq('token', token)
      .single();

    if (error || !link) {
      throw new Error('Shareable link not found');
    }

    // Check if link has expired
    if (new Date(link.expires_at) < new Date()) {
      throw new Error('Shareable link has expired');
    }

    // Increment access count
    await supabase
      .from('veo_shareable_links')
      .update({ access_count: link.access_count + 1 })
      .eq('id', link.id);

    return link;

  } catch (error) {
    console.error('Get shareable link error:', error);
    throw error;
  }
}

/**
 * Get user's shareable links
 */
export async function getUserShareableLinks(userId, limit = 20, offset = 0) {
  try {
    const { data: links, error } = await supabase
      .from('veo_shareable_links')
      .select(`
        *,
        veo_jobs(
          id,
          status,
          platform,
          aspect,
          resolution,
          created_at,
          completed_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get shareable links: ${error.message}`);
    }

    // Add shareable URLs
    const baseUrl = process.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') || 'http://localhost:3000';
    const linksWithUrls = (links || []).map(link => ({
      ...link,
      url: `${baseUrl}/share/${link.token}`
    }));

    return linksWithUrls;

  } catch (error) {
    console.error('Get user shareable links error:', error);
    throw error;
  }
}

/**
 * Update shareable link
 */
export async function updateShareableLink(userId, linkId, updateData) {
  try {
    const { expiresInHours, allowDownload, allowEmbed, password } = updateData;

    const updateFields = {};

    if (expiresInHours !== undefined) {
      const expiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000));
      updateFields.expires_at = expiresAt.toISOString();
    }

    if (password !== undefined) {
      updateFields.password = password ? hashPassword(password) : null;
    }

    const { data, error } = await supabase
      .from('veo_shareable_links')
      .update(updateFields)
      .eq('id', linkId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update shareable link: ${error.message}`);
    }

    return data;

  } catch (error) {
    console.error('Update shareable link error:', error);
    throw error;
  }
}

/**
 * Delete shareable link
 */
export async function deleteShareableLink(userId, linkId) {
  try {
    const { error } = await supabase
      .from('veo_shareable_links')
      .delete()
      .eq('id', linkId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete shareable link: ${error.message}`);
    }

    return { success: true };

  } catch (error) {
    console.error('Delete shareable link error:', error);
    throw error;
  }
}

/**
 * Get video download URL for shareable link
 */
export async function getShareableVideoUrl(token, password = null) {
  try {
    const link = await getShareableLink(token);

    // Check password if required
    if (link.password && !password) {
      throw new Error('Password required');
    }

    if (link.password && password && !verifyPassword(password, link.password)) {
      throw new Error('Invalid password');
    }

    // Generate signed URL for video download
    const { data: signedUrlData } = supabase.storage
      .from('renders')
      .createSignedUrl(link.veo_jobs.output_url, 3600); // 1 hour expiry

    if (!signedUrlData?.signedUrl) {
      throw new Error('Failed to generate download URL');
    }

    return {
      videoUrl: signedUrlData.signedUrl,
      job: link.veo_jobs,
      link: {
        id: link.id,
        accessCount: link.access_count,
        expiresAt: link.expires_at
      }
    };

  } catch (error) {
    console.error('Get shareable video URL error:', error);
    throw error;
  }
}

/**
 * Get shareable link analytics
 */
export async function getShareableLinkAnalytics(userId, linkId) {
  try {
    const { data: link, error } = await supabase
      .from('veo_shareable_links')
      .select(`
        *,
        veo_jobs(
          id,
          platform,
          aspect,
          resolution,
          created_at,
          completed_at
        )
      `)
      .eq('id', linkId)
      .eq('user_id', userId)
      .single();

    if (error || !link) {
      throw new Error('Shareable link not found');
    }

    // Get analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .from('veo_analytics')
      .select('*')
      .eq('event_type', 'shareable_link_accessed')
      .eq('metadata->link_id', linkId)
      .order('created_at', { ascending: false });

    if (analyticsError) {
      console.warn('Failed to get analytics:', analyticsError);
    }

    return {
      link,
      analytics: analytics || [],
      stats: {
        totalAccesses: link.access_count,
        uniqueAccesses: analytics ? new Set(analytics.map(a => a.metadata?.ip_address)).size : 0,
        lastAccessed: analytics?.[0]?.created_at || null
      }
    };

  } catch (error) {
    console.error('Get shareable link analytics error:', error);
    throw error;
  }
}

/**
 * Generate a unique share token
 */
function generateShareToken() {
  // Generate a URL-safe token
  const randomBytes = crypto.randomBytes(16);
  return randomBytes.toString('base64url');
}

/**
 * Hash password for storage
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify password
 */
function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword;
}

/**
 * Clean up expired shareable links
 */
export async function cleanupExpiredLinks() {
  try {
    const { error } = await supabase
      .from('veo_shareable_links')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Failed to cleanup expired links:', error);
    }

    return { success: true };

  } catch (error) {
    console.error('Cleanup expired links error:', error);
    throw error;
  }
}

