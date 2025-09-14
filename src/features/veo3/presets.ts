import { Shot, AudioPlan } from "./types";

export const PLATFORM_PRESETS = {
  tiktok: { 
    aspect: "9:16" as const, 
    resolution: "720p" as const,
    name: "TikTok",
    description: "Vertical short-form content optimized for TikTok",
    maxDuration: 8
  },
  instagram_reel: { 
    aspect: "9:16" as const, 
    resolution: "720p" as const,
    name: "Instagram Reels",
    description: "Vertical short-form content for Instagram Reels",
    maxDuration: 8
  },
  youtube_short: { 
    aspect: "9:16" as const, 
    resolution: "720p" as const,
    name: "YouTube Shorts",
    description: "Vertical short-form content for YouTube Shorts",
    maxDuration: 8
  },
  youtube: { 
    aspect: "16:9" as const, 
    resolution: "1080p" as const,
    name: "YouTube Standard",
    description: "Horizontal content for YouTube main platform",
    maxDuration: 8
  },
  meta_ad: { 
    aspect: "9:16" as const, 
    resolution: "720p" as const,
    name: "Meta Ads",
    description: "Vertical ads for Facebook and Instagram",
    maxDuration: 8
  },
} as const;

export const TEMPLATE_PRESETS = {
  ugc_testimonial: {
    name: "UGC Testimonial",
    description: "User-generated content style testimonial",
    template: {
      goal: "UGC-style testimonial",
      shotPlan: [
        { tStart: 0, tEnd: 2, action: "Person holding product, excited expression", camera: "Close-up", composition: "Medium shot" },
        { tStart: 2, tEnd: 4, action: "Product demonstration, hands showing features", camera: "Dolly in", composition: "Close-up" },
        { tStart: 4, tEnd: 6, action: "Person speaking to camera, genuine smile", camera: "Static", composition: "Medium shot" },
        { tStart: 6, tEnd: 8, action: "Product close-up with brand logo", camera: "Zoom in", composition: "Extreme close-up" }
      ] as Shot[],
      audio: {
        dialogue: "This product changed my life!",
        musicStyle: "upbeat, authentic",
        captions: true
      } as AudioPlan
    }
  },
  product_cinematic: {
    name: "Product Cinematic",
    description: "High-end product showcase with cinematic quality",
    template: {
      goal: "Premium product showcase",
      shotPlan: [
        { tStart: 0, tEnd: 2, action: "Product reveal with dramatic lighting", camera: "Slow dolly", composition: "Wide shot" },
        { tStart: 2, tEnd: 4, action: "Product details and textures", camera: "Macro lens", composition: "Close-up" },
        { tStart: 4, tEnd: 6, action: "Product in use, lifestyle context", camera: "Gimbal pan", composition: "Medium shot" },
        { tStart: 6, tEnd: 8, action: "Brand logo with product", camera: "Static", composition: "Wide shot" }
      ] as Shot[],
      audio: {
        musicStyle: "cinematic strings, orchestral",
        sfx: ["whoosh", "elegant transition"],
        captions: false
      } as AudioPlan
    }
  },
  logo_stinger: {
    name: "Logo Stinger",
    description: "Quick brand logo animation with impact",
    template: {
      goal: "Brand awareness and recognition",
      shotPlan: [
        { tStart: 0, tEnd: 2, action: "Logo animation entrance", camera: "Static", composition: "Close-up" },
        { tStart: 2, tEnd: 4, action: "Logo transformation effects", camera: "Zoom", composition: "Extreme close-up" },
        { tStart: 4, tEnd: 6, action: "Logo with tagline", camera: "Static", composition: "Medium shot" },
        { tStart: 6, tEnd: 8, action: "Logo final reveal with CTA", camera: "Fade out", composition: "Wide shot" }
      ] as Shot[],
      audio: {
        musicStyle: "energetic, electronic",
        sfx: ["logo whoosh", "impact sound"],
        captions: false
      } as AudioPlan
    }
  },
  lifestyle_packshot: {
    name: "Lifestyle + Packshot",
    description: "Lifestyle scene transitioning to product packshot",
    template: {
      goal: "Lifestyle integration with product focus",
      shotPlan: [
        { tStart: 0, tEnd: 2, action: "Lifestyle scene, person using product", camera: "Handheld", composition: "Wide shot" },
        { tStart: 2, tEnd: 4, action: "Transition to product focus", camera: "Dolly in", composition: "Medium shot" },
        { tStart: 4, tEnd: 6, action: "Product packshot, multiple angles", camera: "Rotating", composition: "Close-up" },
        { tStart: 6, tEnd: 8, action: "Brand logo with product", camera: "Static", composition: "Medium shot" }
      ] as Shot[],
      audio: {
        musicStyle: "lifestyle, ambient",
        ambience: "natural, outdoor",
        captions: false
      } as AudioPlan
    }
  }
} as const;

export const BRAND_TONE_OPTIONS = [
  "premium, luxury",
  "playful, fun",
  "professional, corporate",
  "bold, energetic",
  "minimalist, clean",
  "warm, friendly",
  "edgy, modern",
  "classic, timeless"
] as const;

export const CAMERA_MOVEMENTS = [
  "Static",
  "Dolly in",
  "Dolly out", 
  "Pan left",
  "Pan right",
  "Tilt up",
  "Tilt down",
  "Zoom in",
  "Zoom out",
  "Gimbal pan",
  "Handheld",
  "Rotating",
  "Whip pan",
  "Slow motion"
] as const;

export const COMPOSITION_TYPES = [
  "Wide shot",
  "Medium shot", 
  "Close-up",
  "Extreme close-up",
  "Over-the-shoulder",
  "Low angle",
  "High angle",
  "Dutch angle",
  "Rule of thirds",
  "Center frame"
] as const;

export const MUSIC_STYLES = [
  "Cinematic strings",
  "Upbeat electronic",
  "Lofi ambient",
  "Fast trap",
  "Orchestral",
  "Synthwave",
  "Acoustic",
  "Hip-hop",
  "Pop",
  "Rock",
  "Jazz",
  "Classical"
] as const;

export const SFX_OPTIONS = [
  "Whoosh",
  "Impact sound",
  "Engine roar",
  "Nature sounds",
  "City ambience",
  "Mechanical",
  "Electronic",
  "Water sounds",
  "Wind",
  "Footsteps"
] as const;
