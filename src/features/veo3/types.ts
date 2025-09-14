export type Platform = "tiktok" | "instagram_reel" | "youtube_short" | "youtube" | "meta_ad";

export type Aspect = "9:16" | "16:9";

export interface BrandVisual {
  id: string;
  kind: "logo" | "product" | "photo" | "brand_visual";
  url: string; // preview URL from storage or local
  mimeType?: string;
  role?: string; // "opener", "packshot", etc.
}

export interface Shot {
  tStart: number; // seconds
  tEnd: number;   // seconds
  action: string; // what happens
  camera?: string; // dolly in, gimbal pan, etc.
  composition?: string; // close-up, wide, etc.
  notes?: string;
}

export interface AudioPlan {
  dialogue?: string;  // quotes ok
  sfx?: string[];     // "engine roar", "whoosh"
  ambience?: string;  // "lofi ambient", "city night"
  musicStyle?: string; // "fast trap", "cinematic strings"
  captions?: boolean;
  voiceover?: string;  // optional VO script
}

export interface BrandSpec {
  name?: string;
  colors?: string[];   // hex
  fonts?: string[];    // brand fonts by name
  tone?: string;       // bold, playful, premium, etc.
  compliance?: string[]; // disclaimers/constraints
}

export interface VeoPromptJSON {
  idea: string;               // user's plain idea
  goal: string;               // e.g., "product awareness", "UGC-style ad"
  platform: Platform;
  aspect: Aspect;
  resolution?: "720p" | "1080p";
  durationSec: number;
  negativePrompt?: string;
  seed?: number;
  brand: BrandSpec;
  cta?: string;               // e.g., "Shop now", "Learn more"
  visualRefs: BrandVisual[];  // logos/products/photos
  shotPlan: Shot[];           // structure and pacing
  audio: AudioPlan;
}

export interface VeoConfig {
  aspectRatio: Aspect;
  resolution: "720p" | "1080p";
  negativePrompt: string;
  seed: number;
}

export interface VeoPromptResult {
  promptString: string;
  config: VeoConfig;
}

export interface VeoGenerationJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  prompt: VeoPromptJSON;
  config: VeoConfig;
  result?: {
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VeoGenerationRequest {
  prompt: VeoPromptJSON;
  config?: Partial<VeoConfig>;
}

export interface VeoGenerationResponse {
  jobId: string;
  status: "pending" | "processing";
  estimatedTime?: number;
}

export interface VeoJobStatus {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  result?: {
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
  };
  error?: string;
  estimatedTimeRemaining?: number;
}
