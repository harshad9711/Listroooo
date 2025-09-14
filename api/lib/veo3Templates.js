import { createClient } from '@supabase/supabase-js';
import { VeoPromptZ, validateVeoPrompt } from './veo3Schema.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key'
);

/**
 * Create a new template
 */
export async function createTemplate(userId, templateData) {
  try {
    const { name, description, tokens, baseJson } = templateData;

    // Validate required fields
    if (!name || !baseJson) {
      throw new Error('Name and baseJson are required');
    }

    // Validate base JSON against schema
    const validation = validateVeoPrompt(baseJson);
    if (!validation.valid) {
      throw new Error(`Invalid base JSON: ${validation.errors.join(', ')}`);
    }

    // Validate tokens array
    if (!Array.isArray(tokens)) {
      throw new Error('Tokens must be an array');
    }

    // Create template
    const { data, error } = await supabase
      .from('veo_templates')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description?.trim() || null,
        tokens: tokens,
        base_json: baseJson
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Create template error:', error);
    throw error;
  }
}

/**
 * Get user's templates
 */
export async function getUserTemplates(userId, limit = 20, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('veo_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get templates: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Get templates error:', error);
    throw error;
  }
}

/**
 * Get a specific template
 */
export async function getTemplate(userId, templateId) {
  try {
    const { data, error } = await supabase
      .from('veo_templates')
      .select('*')
      .eq('id', templateId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new Error('Template not found');
    }

    return data;
  } catch (error) {
    console.error('Get template error:', error);
    throw error;
  }
}

/**
 * Update a template
 */
export async function updateTemplate(userId, templateId, updateData) {
  try {
    const { name, description, tokens, baseJson } = updateData;

    // Validate base JSON if provided
    if (baseJson) {
      const validation = validateVeoPrompt(baseJson);
      if (!validation.valid) {
        throw new Error(`Invalid base JSON: ${validation.errors.join(', ')}`);
      }
    }

    // Validate tokens if provided
    if (tokens && !Array.isArray(tokens)) {
      throw new Error('Tokens must be an array');
    }

    const updateFields = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateFields.name = name.trim();
    if (description !== undefined) updateFields.description = description?.trim() || null;
    if (tokens !== undefined) updateFields.tokens = tokens;
    if (baseJson !== undefined) updateFields.base_json = baseJson;

    const { data, error } = await supabase
      .from('veo_templates')
      .update(updateFields)
      .eq('id', templateId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Update template error:', error);
    throw error;
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(userId, templateId) {
  try {
    const { error } = await supabase
      .from('veo_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Delete template error:', error);
    throw error;
  }
}

/**
 * Generate variation from template
 */
export async function generateVariationFromTemplate(userId, templateId, tokenValues) {
  try {
    // Get template
    const template = await getTemplate(userId, templateId);
    
    // Validate token values
    if (!tokenValues || typeof tokenValues !== 'object') {
      throw new Error('Token values must be an object');
    }

    // Check that all required tokens have values
    const missingTokens = template.tokens.filter(token => 
      !tokenValues.hasOwnProperty(token.replace(/[{}]/g, ''))
    );
    
    if (missingTokens.length > 0) {
      throw new Error(`Missing values for tokens: ${missingTokens.join(', ')}`);
    }

    // Substitute tokens in base JSON
    const generatedJson = substituteTokens(template.base_json, tokenValues);

    // Validate the generated JSON
    const validation = validateVeoPrompt(generatedJson);
    if (!validation.valid) {
      throw new Error(`Generated JSON is invalid: ${validation.errors.join(', ')}`);
    }

    return {
      template,
      generatedJson,
      prompt: buildPromptString(generatedJson)
    };
  } catch (error) {
    console.error('Generate variation error:', error);
    throw error;
  }
}

/**
 * Substitute tokens in JSON object
 */
function substituteTokens(obj, tokenValues) {
  if (typeof obj === 'string') {
    let result = obj;
    for (const [key, value] of Object.entries(tokenValues)) {
      const tokenPattern = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(tokenPattern, value);
    }
    return result;
  } else if (Array.isArray(obj)) {
    return obj.map(item => substituteTokens(item, tokenValues));
  } else if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteTokens(value, tokenValues);
    }
    return result;
  }
  return obj;
}

/**
 * Build prompt string from VeoPromptJSON (reuse existing function)
 */
function buildPromptString(prompt) {
  const lines = [];
  
  // Header
  lines.push(`Create an 8-second ${prompt.platform} video:`);
  lines.push(`"${prompt.idea}"`);
  lines.push(`Goal: ${prompt.goal}`);
  lines.push('');
  
  // Brand context
  if (prompt.brand.name) {
    lines.push(`Brand: ${prompt.brand.name}`);
  }
  if (prompt.brand.tone) {
    lines.push(`Tone: ${prompt.brand.tone}`);
  }
  if (prompt.brand.colors?.length > 0) {
    lines.push(`Colors: ${prompt.brand.colors.join(', ')}`);
  }
  lines.push('');
  
  // Shot plan
  lines.push('Shot Plan:');
  prompt.shotPlan.forEach((shot, i) => {
    lines.push(`${i + 1}. ${shot.tStart}s-${shot.tEnd}s: ${shot.action}`);
    if (shot.camera) lines.push(`   Camera: ${shot.camera}`);
    if (shot.composition) lines.push(`   Composition: ${shot.composition}`);
  });
  lines.push('');
  
  // Audio
  if (prompt.audio.dialogue) {
    lines.push(`Dialogue: "${prompt.audio.dialogue}"`);
  }
  if (prompt.audio.musicStyle) {
    lines.push(`Music: ${prompt.audio.musicStyle}`);
  }
  if (prompt.audio.sfx?.length > 0) {
    lines.push(`SFX: ${prompt.audio.sfx.join(', ')}`);
  }
  if (prompt.audio.captions) {
    lines.push('Include captions');
  }
  lines.push('');
  
  // CTA
  if (prompt.cta) {
    lines.push(`CTA: ${prompt.cta}`);
  }
  
  // Technical specs
  lines.push(`Format: ${prompt.aspect}, ${prompt.resolution || '720p'}`);
  if (prompt.negativePrompt) {
    lines.push(`Avoid: ${prompt.negativePrompt}`);
  }
  
  return lines.join('\n');
}

