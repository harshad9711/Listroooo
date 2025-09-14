import { VeoPromptJSON, VeoPromptResult, VeoConfig } from "./types";

export function buildVeoPrompt(input: VeoPromptJSON): VeoPromptResult {
  const lines: string[] = [];
  
  // Brand & goal
  lines.push(`Goal: ${input.goal}. Brand tone: ${input.brand.tone ?? "premium, modern"}.`);
  
  if (input.brand.colors?.length) {
    lines.push(`Color palette: ${input.brand.colors.join(", ")}.`);
  }
  
  if (input.brand.name) {
    lines.push(`Brand: ${input.brand.name}.`);
  }
  
  if (input.cta) {
    lines.push(`CTA: ${input.cta}.`);
  }
  
  // Visual references
  if (input.visualRefs?.length) {
    const visualTypes = input.visualRefs.map(v => v.kind).join(", ");
    lines.push(`Visual references: ${visualTypes}.`);
  }
  
  // Shots with timing
  if (input.shotPlan?.length) {
    lines.push(`Shot sequence:`);
    input.shotPlan.forEach(shot => {
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
  const audioBits: string[] = [];
  if (input.audio?.dialogue) {
    audioBits.push(`Dialogue: "${input.audio.dialogue}"`);
  }
  if (input.audio?.voiceover) {
    audioBits.push(`Voiceover: "${input.audio.voiceover}"`);
  }
  if (input.audio?.sfx?.length) {
    audioBits.push(`SFX: ${input.audio.sfx.join(", ")}`);
  }
  if (input.audio?.ambience) {
    audioBits.push(`Ambience: ${input.audio.ambience}`);
  }
  if (input.audio?.musicStyle) {
    audioBits.push(`Music: ${input.audio.musicStyle}`);
  }
  if (input.audio?.captions) {
    audioBits.push(`Captions: enabled`);
  }
  
  if (audioBits.length) {
    lines.push(`Audio: ${audioBits.join(" | ")}`);
  }
  
  // Brand compliance
  if (input.brand.compliance?.length) {
    lines.push(`Compliance: ${input.brand.compliance.join(", ")}`);
  }
  
  // Build the final prompt
  const promptString = `${input.idea}\n\n${lines.join("\n")}`;
  
  // Build config
  const config: VeoConfig = {
    aspectRatio: input.aspect,
    resolution: input.resolution ?? (input.aspect === "16:9" ? "1080p" : "720p"),
    negativePrompt: input.negativePrompt ?? "low quality, washed out, jittery motion, frame drops, blurry, distorted, amateur",
    seed: input.seed ?? 0,
  };
  
  return { promptString, config };
}

export function validateVeoPrompt(input: VeoPromptJSON): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!input.idea?.trim()) {
    errors.push("Idea is required");
  }
  
  if (!input.goal?.trim()) {
    errors.push("Goal is required");
  }
  
  if (!input.platform) {
    errors.push("Platform is required");
  }
  
  if (!input.aspect) {
    errors.push("Aspect ratio is required");
  }
  
  // Duration validation
  if (input.durationSec > 8) {
    errors.push("Duration cannot exceed 8 seconds");
  }
  
  if (input.durationSec < 1) {
    errors.push("Duration must be at least 1 second");
  }
  
  // Shot plan validation
  if (input.shotPlan?.length) {
    let totalDuration = 0;
    for (const shot of input.shotPlan) {
      if (shot.tStart < 0 || shot.tEnd < 0) {
        errors.push("Shot times cannot be negative");
      }
      if (shot.tStart >= shot.tEnd) {
        errors.push("Shot start time must be before end time");
      }
      if (shot.tEnd > input.durationSec) {
        errors.push("Shot end time cannot exceed total duration");
      }
      totalDuration = Math.max(totalDuration, shot.tEnd);
    }
    
    if (totalDuration > input.durationSec) {
      errors.push("Shot plan duration exceeds total duration");
    }
  }
  
  // Resolution validation
  if (input.aspect === "16:9" && input.resolution === "720p") {
    // This is allowed but not optimal
  } else if (input.aspect === "9:16" && input.resolution === "1080p") {
    errors.push("9:16 aspect ratio only supports 720p resolution");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function createDefaultVeoPrompt(platform: string): VeoPromptJSON {
  const platformPreset = PLATFORM_PRESETS[platform as keyof typeof PLATFORM_PRESETS];
  
  return {
    idea: "",
    goal: "Create engaging video content",
    platform: platform as any,
    aspect: platformPreset?.aspect || "9:16",
    resolution: platformPreset?.resolution || "720p",
    durationSec: 8,
    negativePrompt: "low quality, washed out, jittery motion, frame drops",
    seed: 0,
    brand: {
      tone: "premium, modern"
    },
    cta: "",
    visualRefs: [],
    shotPlan: [
      { tStart: 0, tEnd: 2, action: "Opening shot", camera: "Static", composition: "Wide shot" },
      { tStart: 2, tEnd: 4, action: "Main content", camera: "Dolly in", composition: "Medium shot" },
      { tStart: 4, tEnd: 6, action: "Product focus", camera: "Close-up", composition: "Close-up" },
      { tStart: 6, tEnd: 8, action: "Closing shot", camera: "Static", composition: "Wide shot" }
    ],
    audio: {
      musicStyle: "cinematic",
      captions: false
    }
  };
}

// Import PLATFORM_PRESETS for the default prompt function
import { PLATFORM_PRESETS } from "./presets";



