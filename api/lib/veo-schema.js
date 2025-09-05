import { z } from "zod";

export const BeatSchema = z.object({
  t: z.number().int().min(0),
  duration: z.number().int().min(1),
  action: z.string().min(1),
  shot: z.string().min(1),
  on_screen_text: z.string().optional(),
  voiceover: z.string().optional(),
  product_callout: z.string().optional(),
});

export const PromptSchema = z.object({
  meta: z.object({
    product: z.string().min(1),
    objective: z.enum(["awareness","consideration","conversion","ugc_ad","launch","howto"]).default("awareness"),
    duration_seconds: z.number().int().min(6).max(60).default(20),
    aspect_ratio: z.enum(["9:16","1:1","16:9"]).default("9:16"),
    platform: z.enum(["tiktok","instagram_reels","youtube_shorts","all"]).default("tiktok"),
    language: z.string().default("en-US"),
    tone: z.string().default("cinematic, modern, confident"),
  }),
  story: z.object({
    hook: z.string().optional(),
    beats: z.array(BeatSchema).min(3),
    cta: z.string().optional(),
  }),
  visuals: z.object({
    camera: z.string().min(1),
    lighting: z.string().min(1),
    color_grade: z.string().min(1),
    motion_style: z.string().min(1),
    negative_prompts: z.string().optional(),
  }),
  audio: z.object({
    music_style: z.string().min(1),
    music_bpm_target: z.number().int().optional(),
    sfx_notes: z.string().optional(),
    voiceover_flag: z.boolean().default(true),
    voice_profile: z.string().optional(),
    caption_style: z.string().optional(),
  }),
  branding: z.object({
    brand_name: z.string().default("Your Brand"),
    palette: z.array(z.string()).default(["#111111","#6C5CE7","#FFFFFF"]),
    font: z.string().default("Inter"),
    logo_url: z.string().url().optional(),
    product_urls: z.array(z.string()).optional(),
  }),
  deliverables: z.object({
    exports: z.array(z.enum(["mp4","mov","webm","gif"]).default("mp4")).default(["mp4"]),
    captions_burned_in: z.boolean().default(true),
    captions_sidecar: z.boolean().default(true),
    sidecar_format: z.enum(["srt","vtt"]).default("srt"),
    thumbnail_prompts: z.array(z.string()).optional(),
  })
});

export function normalizeBeats(metaDuration, beats) {
  const sum = beats.reduce((a,b)=>a+(b.duration||0),0);
  if (sum <= 0) return beats;
  const scale = metaDuration / sum;
  const scaled = beats.map((b) => ({ ...b, duration: Math.max(1, Math.round((b.duration||1) * scale)) }));
  let cursor = 0;
  const retimed = scaled.map(b => { const out = { ...b, t: cursor }; cursor += b.duration; return out; });
  const drift = cursor - metaDuration;
  if (drift !== 0 && retimed.length) retimed[retimed.length-1].duration = Math.max(1, retimed[retimed.length-1].duration - drift);
  cursor = 0;
  return retimed.map(b => { const out = { ...b, t: cursor }; cursor += b.duration; return out; });
}

