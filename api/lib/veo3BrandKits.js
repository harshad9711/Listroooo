import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key'
);

/**
 * Create a new brand kit
 */
export async function createBrandKit(userId, brandKitData) {
  try {
    const { name, colors, fonts, tone, compliance } = brandKitData;

    // Validate required fields
    if (!name) {
      throw new Error('Name is required');
    }

    // Validate colors array
    if (colors && !Array.isArray(colors)) {
      throw new Error('Colors must be an array');
    }

    // Validate fonts array
    if (fonts && !Array.isArray(fonts)) {
      throw new Error('Fonts must be an array');
    }

    // Validate compliance array
    if (compliance && !Array.isArray(compliance)) {
      throw new Error('Compliance must be an array');
    }

    // Validate color format
    if (colors) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      const invalidColors = colors.filter(color => !colorRegex.test(color));
      if (invalidColors.length > 0) {
        throw new Error(`Invalid color format: ${invalidColors.join(', ')}`);
      }
    }

    // Create brand kit
    const { data, error } = await supabase
      .from('veo_brand_kits')
      .insert({
        user_id: userId,
        name: name.trim(),
        colors: colors || [],
        fonts: fonts || [],
        tone: tone?.trim() || null,
        compliance: compliance || []
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create brand kit: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Create brand kit error:', error);
    throw error;
  }
}

/**
 * Get user's brand kits
 */
export async function getUserBrandKits(userId, limit = 20, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('veo_brand_kits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get brand kits: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Get brand kits error:', error);
    throw error;
  }
}

/**
 * Get a specific brand kit
 */
export async function getBrandKit(userId, brandKitId) {
  try {
    const { data, error } = await supabase
      .from('veo_brand_kits')
      .select('*')
      .eq('id', brandKitId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new Error('Brand kit not found');
    }

    return data;
  } catch (error) {
    console.error('Get brand kit error:', error);
    throw error;
  }
}

/**
 * Update a brand kit
 */
export async function updateBrandKit(userId, brandKitId, updateData) {
  try {
    const { name, colors, fonts, tone, compliance } = updateData;

    // Validate colors if provided
    if (colors) {
      if (!Array.isArray(colors)) {
        throw new Error('Colors must be an array');
      }
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      const invalidColors = colors.filter(color => !colorRegex.test(color));
      if (invalidColors.length > 0) {
        throw new Error(`Invalid color format: ${invalidColors.join(', ')}`);
      }
    }

    // Validate fonts if provided
    if (fonts && !Array.isArray(fonts)) {
      throw new Error('Fonts must be an array');
    }

    // Validate compliance if provided
    if (compliance && !Array.isArray(compliance)) {
      throw new Error('Compliance must be an array');
    }

    const updateFields = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateFields.name = name.trim();
    if (colors !== undefined) updateFields.colors = colors;
    if (fonts !== undefined) updateFields.fonts = fonts;
    if (tone !== undefined) updateFields.tone = tone?.trim() || null;
    if (compliance !== undefined) updateFields.compliance = compliance;

    const { data, error } = await supabase
      .from('veo_brand_kits')
      .update(updateFields)
      .eq('id', brandKitId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update brand kit: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Update brand kit error:', error);
    throw error;
  }
}

/**
 * Delete a brand kit
 */
export async function deleteBrandKit(userId, brandKitId) {
  try {
    const { error } = await supabase
      .from('veo_brand_kits')
      .delete()
      .eq('id', brandKitId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete brand kit: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Delete brand kit error:', error);
    throw error;
  }
}

/**
 * Upload asset to brand kit
 */
export async function uploadBrandAsset(userId, brandKitId, assetData) {
  try {
    const { kind, url, mimeType, role } = assetData;

    if (!kind || !url) {
      throw new Error('Kind and URL are required');
    }

    // Validate kind
    const validKinds = ['logo', 'product', 'photo', 'brand_visual'];
    if (!validKinds.includes(kind)) {
      throw new Error(`Invalid kind. Must be one of: ${validKinds.join(', ')}`);
    }

    // Verify brand kit exists and belongs to user
    await getBrandKit(userId, brandKitId);

    // Create asset
    const { data, error } = await supabase
      .from('veo_brand_assets')
      .insert({
        user_id: userId,
        brand_kit_id: brandKitId,
        kind: kind,
        url: url,
        mime_type: mimeType || null,
        role: role || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upload asset: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Upload brand asset error:', error);
    throw error;
  }
}

/**
 * Get brand kit assets
 */
export async function getBrandKitAssets(userId, brandKitId) {
  try {
    // Verify brand kit exists and belongs to user
    await getBrandKit(userId, brandKitId);

    const { data, error } = await supabase
      .from('veo_brand_assets')
      .select('*')
      .eq('user_id', userId)
      .eq('brand_kit_id', brandKitId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get brand assets: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Get brand kit assets error:', error);
    throw error;
  }
}

/**
 * Get brand kit assets by kind
 */
export async function getBrandAssetsByKind(userId, brandKitId, kind) {
  try {
    // Verify brand kit exists and belongs to user
    await getBrandKit(userId, brandKitId);

    const { data, error } = await supabase
      .from('veo_brand_assets')
      .select('*')
      .eq('user_id', userId)
      .eq('brand_kit_id', brandKitId)
      .eq('kind', kind)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get brand assets by kind: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Get brand assets by kind error:', error);
    throw error;
  }
}

/**
 * Update brand asset
 */
export async function updateBrandAsset(userId, assetId, updateData) {
  try {
    const { kind, url, mimeType, role } = updateData;

    // Validate kind if provided
    if (kind) {
      const validKinds = ['logo', 'product', 'photo', 'brand_visual'];
      if (!validKinds.includes(kind)) {
        throw new Error(`Invalid kind. Must be one of: ${validKinds.join(', ')}`);
      }
    }

    const updateFields = {};

    if (kind !== undefined) updateFields.kind = kind;
    if (url !== undefined) updateFields.url = url;
    if (mimeType !== undefined) updateFields.mime_type = mimeType;
    if (role !== undefined) updateFields.role = role;

    const { data, error } = await supabase
      .from('veo_brand_assets')
      .update(updateFields)
      .eq('id', assetId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update brand asset: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Update brand asset error:', error);
    throw error;
  }
}

/**
 * Delete brand asset
 */
export async function deleteBrandAsset(userId, assetId) {
  try {
    const { error } = await supabase
      .from('veo_brand_assets')
      .delete()
      .eq('id', assetId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete brand asset: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Delete brand asset error:', error);
    throw error;
  }
}

