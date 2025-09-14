import { z } from 'zod';

// Server-side Zod schema for Veo 3 prompts
export const VeoPromptZ = z.object({
  idea: z.string().min(5).max(500),
  goal: z.string().min(3).max(80),
  platform: z.enum(["tiktok", "instagram_reel", "youtube_short", "youtube", "meta_ad"]),
  aspect: z.enum(["9:16", "16:9"]),
  resolution: z.enum(["720p", "1080p"]).optional(),
  durationSec: z.literal(8),
  negativePrompt: z.string().max(300).optional(),
  seed: z.number().int().min(0).max(999999).optional(),
  brand: z.object({
    name: z.string().max(100).optional(),
    colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).max(6).optional(),
    fonts: z.array(z.string().max(50)).max(4).optional(),
    tone: z.string().max(60).optional(),
    compliance: z.array(z.string().max(100)).max(6).optional()
  }),
  cta: z.string().max(60).optional(),
  visualRefs: z.array(z.object({
    id: z.string().uuid(),
    kind: z.enum(["logo", "product", "photo", "brand_visual"]),
    url: z.string().url().max(500),
    mimeType: z.string().max(50).optional(),
    role: z.string().max(40).optional()
  })).max(6),
  shotPlan: z.array(z.object({
    tStart: z.number().min(0).max(8),
    tEnd: z.number().min(0).max(8),
    action: z.string().min(2).max(160),
    camera: z.string().max(80).optional(),
    composition: z.string().max(80).optional(),
    notes: z.string().max(160).optional()
  })).min(1).max(8),
  audio: z.object({
    dialogue: z.string().max(200).optional(),
    sfx: z.array(z.string().max(50)).max(8).optional(),
    ambience: z.string().max(80).optional(),
    musicStyle: z.string().max(80).optional(),
    captions: z.boolean().optional(),
    voiceover: z.string().max(200).optional()
  })
});

// Additional validation for business rules
export function validateVeoPrompt(prompt) {
  const result = VeoPromptZ.safeParse(prompt);
  
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    };
  }

  // Additional business rule validations
  const errors = [];
  
  // Validate shot plan timing
  for (const shot of prompt.shotPlan) {
    if (shot.tStart >= shot.tEnd) {
      errors.push(`Shot ${shot.action}: start time must be before end time`);
    }
    if (shot.tEnd > prompt.durationSec) {
      errors.push(`Shot ${shot.action}: end time cannot exceed total duration`);
    }
  }
  
  // Validate aspect ratio and resolution compatibility
  if (prompt.aspect === "9:16" && prompt.resolution === "1080p") {
    errors.push("9:16 aspect ratio only supports 720p resolution");
  }
  
  // Validate prompt string length
  const promptString = buildPromptString(prompt);
  if (promptString.length > 8000) {
    errors.push("Generated prompt string exceeds 8000 character limit");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Build prompt string (server-side version)
export function buildPromptString(prompt) {
  const lines = [];
  
  // Brand & goal
  lines.push(`Goal: ${prompt.goal}. Brand tone: ${prompt.brand.tone ?? "premium, modern"}.`);
  
  if (prompt.brand.colors?.length) {
    lines.push(`Color palette: ${prompt.brand.colors.join(", ")}.`);
  }
  
  if (prompt.brand.name) {
    lines.push(`Brand: ${prompt.brand.name}.`);
  }
  
  if (prompt.cta) {
    lines.push(`CTA: ${prompt.cta}.`);
  }
  
  // Visual references
  if (prompt.visualRefs?.length) {
    const visualTypes = prompt.visualRefs.map(v => v.kind).join(", ");
    lines.push(`Visual references: ${visualTypes}.`);
  }
  
  // Shots with timing
  if (prompt.shotPlan?.length) {
    lines.push(`Shot sequence:`);
    prompt.shotPlan.forEach(shot => {
      const shotLine = `[${shot.tStart}-${shot.tEnd}s] ${shot.action}`;
      const details = [];
      
      if (shot.camera) details.push(`camera: ${shot.camera}`);
      if (shot.composition) details.push(`composition: ${shot.composition}`);
      if (shot.notes) details.push(`notes: ${shot.notes}`);
      
      const fullShotLine = details.length > 0 
        ? `${shotLine} | ${details.join(" | ")}`
        : shotLine;
      
      lines.push(`  ${fullShotLine}`);
    });
  }
  
  // Audio cues
  const audioBits = [];
  if (prompt.audio?.dialogue) {
    audioBits.push(`Dialogue: "${prompt.audio.dialogue}"`);
  }
  if (prompt.audio?.voiceover) {
    audioBits.push(`Voiceover: "${prompt.audio.voiceover}"`);
  }
  if (prompt.audio?.sfx?.length) {
    audioBits.push(`SFX: ${prompt.audio.sfx.join(", ")}`);
  }
  if (prompt.audio?.ambience) {
    audioBits.push(`Ambience: ${prompt.audio.ambience}`);
  }
  if (prompt.audio?.musicStyle) {
    audioBits.push(`Music: ${prompt.audio.musicStyle}`);
  }
  if (prompt.audio?.captions) {
    audioBits.push(`Captions: enabled`);
  }
  
  if (audioBits.length) {
    lines.push(`Audio: ${audioBits.join(" | ")}`);
  }
  
  // Brand compliance
  if (prompt.brand.compliance?.length) {
    lines.push(`Compliance: ${prompt.brand.compliance.join(", ")}`);
  }
  
  return `${prompt.idea}\n\n${lines.join("\n")}`;
}

// Generate idea hash for idempotency
export function generateIdeaHash(prompt) {
  const crypto = require('crypto');
  const hashInput = JSON.stringify({
    idea: prompt.idea,
    goal: prompt.goal,
    platform: prompt.platform,
    assetRefs: prompt.visualRefs.map(v => ({ kind: v.kind, url: v.url }))
  });
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}
