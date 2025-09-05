"use client";

// Veo 3 All‑in‑One Quick Test with Server LLM + DB + S3 Export
// • Single file with EVERYTHING: schema, presets, idea→JSON, renderer, UI
// • Server LLM integration for better prompt generation
// • Database storage with Prisma
// • S3 export functionality

import React, { useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Download, Wand2, RefreshCcw, Copy, Sparkles, Film, FileJson, Type, Palette, Undo2, Settings2, Database, Cloud } from "lucide-react";

// Import schema from lib
import { PromptSchema, normalizeBeats } from "../lib/veo-schema";

// =========================
// 1) SCHEMA + UTILITIES
// =========================
const BeatSchema = z.object({
  t: z.number().int().min(0),
  duration: z.number().int().min(1),
  action: z.string().min(1),
  shot: z.string().min(1),
  on_screen_text: z.string().optional(),
  voiceover: z.string().optional(),
  product_callout: z.string().optional(),
});

type ListroVeoPrompt = z.infer<typeof PromptSchema>;
type Beat = z.infer<typeof BeatSchema>;

function renderVeoPrompt(p: ListroVeoPrompt){
  const lines: string[] = [];
  lines.push(`Title: Cinematic Short-Form Ad for ${p.meta.product} (${p.meta.aspect_ratio}, ${p.meta.duration_seconds}s)`);
  lines.push("");
  lines.push(`Objective: ${p.meta.objective} on ${p.meta.platform}; tone ${p.meta.tone}, language ${p.meta.language}.`);
  lines.push("");
  lines.push("Cinematography:");
  lines.push(`- Camera: ${p.visuals.camera}`);
  lines.push(`- Lighting: ${p.visuals.lighting}`);
  lines.push(`- Color Grade: ${p.visuals.color_grade}`);
  lines.push(`- Motion: ${p.visuals.motion_style}`);
  if (p.visuals.negative_prompts) lines.push(`- Avoid: ${p.visuals.negative_prompts}`);
  lines.push("");
  lines.push("Audio:");
  lines.push(`- Music: ${p.audio.music_style}${p.audio.music_bpm_target ? ` at ~${p.audio.music_bpm_target} BPM` : ""}`);
  lines.push(`- Voiceover: ${p.audio.voiceover_flag ? (p.audio.voice_profile || "Yes") : "No VO"}`);
  if (p.audio.sfx_notes) lines.push(`- SFX: ${p.audio.sfx_notes}`);
  if (p.audio.caption_style) lines.push(`- Captions: ${p.audio.caption_style}`);
  lines.push("");
  lines.push("Branding:");
  lines.push(`- Brand: ${p.branding.brand_name}`);
  if (p.branding.palette?.length) lines.push(`- Palette: ${p.branding.palette.join(", ")}`);
  if (p.branding.font) lines.push(`- Font: ${p.branding.font}`);
  if (p.branding.logo_url) lines.push(`- Logo: ${p.branding.logo_url}`);
  if (p.branding.product_urls?.length) lines.push(`- Product URLs: ${p.branding.product_urls.join(", ")}`);
  lines.push("");
  lines.push("Story Beats (timecoded):");
  p.story.beats.forEach(b => {
    lines.push(`- t=${b.t}s (${b.duration}s): ${b.action} | Shot: ${b.shot}`);
    if (b.on_screen_text) lines.push(`  Text: "${b.on_screen_text}"`);
    if (b.voiceover) lines.push(`  VO: "${b.voiceover}"`);
    if (b.product_callout) lines.push(`  Callout: ${b.product_callout}`);
  });
  if (p.story.hook){ lines.push(""); lines.push(`Hook (cold open if present): ${p.story.hook}`); }
  if (p.story.cta){ lines.push(`CTA: ${p.story.cta}`); }
  lines.push("");
  lines.push("Deliverables:");
  lines.push(`- Exports: ${p.deliverables.exports.join(", ")}; Captions burned in: ${p.deliverables.captions_burned_in}; Sidecar: ${p.deliverables.sidecar} (${p.deliverables.sidecar_format})`);
  if (p.deliverables.thumbnail_prompts?.length) lines.push(`- Thumbnail ideas: ${p.deliverables.thumbnail_prompts.join(" | ")}`);
  return lines.join("\n");
}

// =========================
// 2) STYLE PRESETS + INDUSTRY TEMPLATES
// =========================
const STYLE_PRESETS = [
  {
    name: "Hollywood Cinematic",
    visuals: {
      camera: "Anamorphic look; 35/50mm equivalents; controlled dolly; 24fps + 120fps inserts",
      lighting: "Key + fill + hair; practical bokeh; haze for volume",
      color_grade: "Filmic print emulation, soft halation, rich mids",
      motion_style: "Measured cuts with tasteful speed ramps",
      negative_prompts: "avoid handheld wobble, avoid oversaturated neons"
    },
    audio: { music_style: "Cinematic hybrid", music_bpm_target: 96 }
  },
  {
    name: "Fast Viral Ad",
    visuals: {
      camera: "Handheld gimbal; whip pans; punch-ins",
      lighting: "High key, commercial crisp",
      color_grade: "Clean contrast, vibrant but not clipped",
      motion_style: "3–5 frame smash cuts on beat",
      negative_prompts: "avoid low light noise, avoid noisy backgrounds"
    },
    audio: { music_style: "Trap/electro hooky", music_bpm_target: 125 }
  },
  {
    name: "Aesthetic Moodboard",
    visuals: {
      camera: "Static tableaux + gentle sliders; macro textures",
      lighting: "Window light, golden hour, candles",
      color_grade: "Warm, creamy highlights; subdued saturation",
      motion_style: "Cross-dissolves, slow fades",
      negative_prompts: "avoid jitter, avoid harsh speculars"
    },
    audio: { music_style: "Dream pop / downtempo", music_bpm_target: 88 }
  },
] as const;

type PartialPrompt = Partial<ListroVeoPrompt>;
const INDUSTRY_TEMPLATES: Record<string, PartialPrompt> = {
  "Real Estate Tour": {
    meta: { product: "Modern 2BR Loft", objective: "consideration", duration_seconds: 25, aspect_ratio: "9:16", platform: "instagram_reels", tone: "clean, inviting, premium" } as any,
    story: {
      hook: "Sunlight flares across open-plan living room.",
      beats: [
        { t: 0, duration: 5, action: "Wide reveal of living room; pan to kitchen island", shot: "16–24mm gimbal, slow parallax", on_screen_text: "Open concept" },
        { t: 5, duration: 5, action: "Primary bedroom with window light; detail on fixtures", shot: "35/50mm primes" },
        { t: 10, duration: 5, action: "Bathroom marble & rainfall shower closeups", shot: "Macro + slider", product_callout: "Heated floors" },
        { t: 15, duration: 5, action: "Balcony view; city skyline", shot: "Drone or long lens" },
        { t: 20, duration: 5, action: "Floorplan overlay + CTA", shot: "Overhead plan animation", on_screen_text: "Book a tour →" }
      ],
      cta: "Book a tour today."
    },
    visuals: { camera: "Ultra-wide for spaces + 35/50 detail", lighting: "Natural + bounce fill", color_grade: "Clean neutral, gentle contrast", motion_style: "Slow parallax + dissolves", negative_prompts: "avoid clutter, avoid harsh vertical distortion" },
    audio: { music_style: "Light upbeat house", music_bpm_target: 112, voiceover_flag: true, voice_profile: "friendly, warm" },
    branding: { brand_name: "Listro Realty", palette: ["#0F172A","#22D3EE","#FFFFFF"], font: "Inter" },
    deliverables: { exports: ["mp4"], captions_burned_in: true, captions_sidecar: true, sidecar_format: "srt" }
  },
  "SaaS App Demo": {
    meta: { product: "Listro – AI Product Optimizer", objective: "consideration", duration_seconds: 20, aspect_ratio: "9:16", platform: "tiktok", tone: "sleek, high-tech, confident" } as any,
    story: {
      hook: "Dashboard snap to life; metrics tick upward.",
      beats: [
        { t: 0, duration: 4, action: "Hero dashboard reveal", shot: "Screen capture + 3D tilt", on_screen_text: "Optimize Listings" },
        { t: 4, duration: 5, action: "One-click A/B test setup", shot: "Cursor highlights + zooms", voiceover: "Spin up tests in seconds." },
        { t: 9, duration: 4, action: "AI prompt presets applied", shot: "Panels slide; tags animate", product_callout: "Cinematic Veo 3" },
        { t: 13, duration: 4, action: "Results graph surges", shot: "Reveals CTR + CVR", voiceover: "Higher CTR, lower CAC." },
        { t: 17, duration: 3, action: "CTA lockup", shot: "Logo + button animation", on_screen_text: "Try Listro →" }
      ],
      cta: "Start free trial."
    },
    visuals: { camera: "Screen-cam + UI parallax", lighting: "N/A", color_grade: "Tech crisp", motion_style: "Punchy UI-synced cuts", negative_prompts: "avoid crowded UI" },
    audio: { music_style: "Modern electronic", music_bpm_target: 118, voiceover_flag: true, voice_profile: "crisp, modern", caption_style: "tech HUD lower-thirds" },
    branding: { brand_name: "Listro" },
    deliverables: { exports: ["mp4"], captions_burned_in: true, captions_sidecar: true, sidecar_format: "srt" }
  },
  "Fitness Supplement": {
    meta: { product: "NitroLift Pre-Workout", objective: "awareness", duration_seconds: 18, aspect_ratio: "9:16", platform: "tiktok", tone: "intense, energetic" } as any,
    story: {
      hook: "Scoop hits shaker; dust plume in backlight.",
      beats: [
        { t: 0, duration: 3, action: "Gym door slam; athlete chalks hands", shot: "Handheld 50mm, high shutter" },
        { t: 3, duration: 5, action: "Mix + shake; color swirl macro", shot: "Macro 100mm slow-mo", product_callout: "Citrus Fire" },
        { t: 8, duration: 4, action: "PR lift sequence", shot: "Gimbal tracking, whip pans", on_screen_text: "Focus • Power" },
        { t: 12, duration: 3, action: "Athlete stare-down with sweat rim light", shot: "Low key, edge light" },
        { t: 15, duration: 3, action: "Hero + CTA", shot: "Tabletop glossy", on_screen_text: "Unleash it →" }
      ],
      cta: "Unleash it."
    },
    visuals: { camera: "Handheld kinetic; macro inserts", lighting: "Moody high-contrast", color_grade: "Punchy, cool shadows", motion_style: "Smash cuts on beat", negative_prompts: "avoid muddy mids" },
    audio: { music_style: "Aggressive trap/rock hybrid", music_bpm_target: 128, voiceover_flag: true, voice_profile: "gritty, powerful" },
    branding: { brand_name: "NitroLift", palette: ["#0B0B0B","#FF1F1F","#FFFFFF"] },
    deliverables: { exports: ["mp4"], captions_burned_in: true, captions_sidecar: true, sidecar_format: "srt" }
  },
  "DTC Fragrance": {
    meta: { product: "Nocturne Eau de Parfum", objective: "consideration", duration_seconds: 20, aspect_ratio: "9:16", platform: "instagram_reels", tone: "romantic, cinematic, luxe" } as any,
    story: {
      hook: "Candle flame dances; bottle silhouette emerges.",
      beats: [
        { t: 0, duration: 4, action: "Perfume mist in backlight", shot: "85mm, slow push" },
        { t: 4, duration: 5, action: "Texture inserts: velvet, leather, night city rain", shot: "Macro montage", product_callout: "Amber • Bergamot • Cedar" },
        { t: 9, duration: 4, action: "Wrist spritz; smile in mirror bokeh", shot: "Soft diffusion" },
        { t: 13, duration: 4, action: "Bottle on marble; ripples of light", shot: "Slider + prism" },
        { t: 17, duration: 3, action: "Hero title + CTA", shot: "Static lockup", on_screen_text: "Own the night →" }
      ],
      cta: "Own the night."
    },
    visuals: { camera: "Soft primes; slider; prism effects", lighting: "Low key with warm practicals", color_grade: "Warm gold highlights, deep blues", motion_style: "Lingering shots with elegant dissolves", negative_prompts: "avoid harsh reflections" },
    audio: { music_style: "Dream pop / ambient", music_bpm_target: 92, voiceover_flag: true, voice_profile: "soft, intimate" },
    branding: { brand_name: "Nocturne" },
    deliverables: { exports: ["mp4","mov"], captions_burned_in: true, captions_sidecar: true, sidecar_format: "srt" }
  },
  "Gaming / Esports Highlight": {
    meta: { product: "HyperClaw Mouse V2", objective: "awareness", duration_seconds: 15, aspect_ratio: "9:16", platform: "youtube_shorts", tone: "hype, high-tech" } as any,
    story: {
      hook: "RGB pulse syncs with bass hit.",
      beats: [
        { t: 0, duration: 3, action: "Snap zoom on click; instant flick shot montage", shot: "Screen capture + camera shake overlay", on_screen_text: "Aim. Click. Win." },
        { t: 3, duration: 4, action: "Close-up of switches + skates", shot: "Macro with speculars", product_callout: "26K DPI | 55g" },
        { t: 7, duration: 4, action: "Drag-flick slow-mo + neon trails", shot: "Stylized VFX overlay" },
        { t: 11, duration: 4, action: "Hero spin + CTA", shot: "Turntable, RGB cycle", on_screen_text: "Upgrade now →" }
      ],
      cta: "Upgrade now."
    },
    visuals: { camera: "Macro + product hero + gameplay capture", lighting: "Neon key with rim", color_grade: "Cool magenta/teal tech", motion_style: "Beat-synced cuts + HUD overlays", negative_prompts: "avoid muddy blacks" },
    audio: { music_style: "Bass-heavy EDM", music_bpm_target: 130, voiceover_flag: true, voice_profile: "hype, crisp", caption_style: "bold kinetic with glow" },
    branding: { brand_name: "HyperClaw" },
    deliverables: { exports: ["mp4"], captions_burned_in: true, captions_sidecar: true, sidecar_format: "srt" }
  }
};

// =========================
// 3) UI COMPONENT
// =========================
export default function Veo3PromptBuilder(){
  const [idea, setIdea] = useState("Make a 20s dramatic launch video for our new cold brew can. Macro ice shots, moody lighting, quick city cutaways. CTA: 'Fuel your day'. Cool blue grade. Fast pace for TikTok.");
  const [product, setProduct] = useState("Glacier Cold Brew – 12oz Can");
  const [objective, setObjective] = useState<"awareness"|"consideration"|"conversion"|"ugc_ad"|"launch"|"howto">("awareness");
  const [platform, setPlatform] = useState<"tiktok"|"instagram_reels"|"youtube_shorts"|"all">("tiktok");
  const [aspect, setAspect] = useState<"9:16"|"1:1"|"16:9">("9:16");
  const [duration, setDuration] = useState(20);
  const [brand, setBrand] = useState("Listro");
  const [palette, setPalette] = useState("#0E1A2B, #2FA3D6, #FFFFFF");
  const [styleName, setStyleName] = useState(STYLE_PRESETS[0].name);
  const [voiceover, setVoiceover] = useState(true);

  // State for server integration
  const [jsonOut, setJsonOut] = useState<ListroVeoPrompt | null>(null);
  const [textOut, setTextOut] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  function resetForm(){
    setIdea(""); setProduct(""); setBrand(""); setPalette("#111111, #6C5CE7, #FFFFFF"); setObjective("awareness"); setPlatform("tiktok"); setAspect("9:16"); setDuration(20); setStyleName(STYLE_PRESETS[0].name); setVoiceover(true); setJsonOut(null); setTextOut("");
  }

  const generate = async () => {
    setBusy(true);
    try {
      // Always use server LLM - no more client-side fallback
      const r = await fetch("/api/veo/idea-to-json", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ idea }) 
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Server error");
      const json = data.prompt;
      setJsonOut(json);
      setTextOut(renderVeoPrompt(json as any));
    } catch (e:any) {
      console.error("Generation failed:", e.message);
      // Use non-blocking error display instead of alert
      setTextOut(`Error: ${e.message}. Please try again or check your server connection.`);
    } finally { 
      setBusy(false); 
    }
  };

  // Server integration functions
  async function saveToDB(){
    if (!jsonOut) return;
    try {
      const r = await fetch("/api/veo/prompts", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ prompt: jsonOut, idea }) 
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Save failed");
      console.log("Saved to DB:", data.id);
      setTextOut(prev => prev + `\n\n✅ Saved to database with ID: ${data.id}`);
    } catch (e: any) {
      console.error("Save failed:", e.message);
      setTextOut(prev => prev + `\n\n❌ Save failed: ${e.message}`);
    }
  }

  async function exportToS3(){
    if (!jsonOut) return;
    try {
      const r = await fetch("/api/veo/export", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          id: jsonOut?.meta?.product, 
          json: jsonOut, 
          instructionsText: textOut 
        }) 
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Export failed");
      console.log("Exported to S3:", data);
      setTextOut(prev => prev + `\n\n✅ Exported to S3:\nJSON: ${data.jsonUrl}\nInstructions: ${data.instructionsUrl || "N/A"}`);
    } catch (e: any) {
      console.error("Export failed:", e.message);
      setTextOut(prev => prev + `\n\n❌ Export failed: ${e.message}`);
    }
  }

  const useIndustry = (key: string) => {
    const t = INDUSTRY_TEMPLATES[key];
    if (!t) return;
    setProduct((t.meta as any)?.product || "");
    setObjective(((t.meta as any)?.objective || "awareness") as any);
    setDuration(((t.meta as any)?.duration_seconds || 20) as any);
    setAspect(((t.meta as any)?.duration_seconds || "9:16") as any);
    setPlatform(((t.meta as any)?.platform || "tiktok") as any);
    setBrand(((t.branding as any)?.brand_name || "") as any);
    setPalette(((t.branding as any)?.palette || ["#111111","#6C5CE7","#FFFFFF"]).join(", "));

    // Build full prompt from template
    const safe: ListroVeoPrompt = PromptSchema.parse({
      meta: { language: "en-US", tone: "cinematic, modern, confident", ...(t.meta as any) },
      story: { ...(t.story as any) },
      visuals: { ...(t.visuals as any) },
      audio: { ...(t.audio as true) },
      branding: { font: "Inter", ...(t.branding as any) },
      deliverables: { exports: ["mp4"], captions_burned_in: true, captions_sidecar: true, sidecar_format: "srt", ...(t.deliverables as any) },
    });
    safe.story.beats = normalizeBeats(safe.meta.duration_seconds, safe.story.beats as any);
    setJsonOut(safe);
    setTextOut(renderVeoPrompt(safe));
  };

  const copyJSON = async () => {
    if (!jsonOut) return;
    await navigator.clipboard.writeText(JSON.stringify(jsonOut, null, 2));
    setCopied(true); setTimeout(()=>setCopied(false), 1200);
  };
  const copyText = async () => {
    if (!textOut) return;
    await navigator.clipboard.writeText(textOut);
    setCopied(true); setTimeout(()=>setCopied(false), 1200);
  };
  const download = (type: "json"|"txt") => {
    const blob = new Blob([
      type === "json" ? JSON.stringify(jsonOut, null, 2) : textOut
    ], { type: type === "json" ? "application/json" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = type === "json" ? `listro-veo-prompt.json` : `listro-veo-instructions.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <motion.h1 initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <Film className="w-8 h-8"/> Veo 3 Cinematic Prompt Builder
        <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">Listro</span>
      </motion.h1>

      <div className="card shadow-sm border rounded-2xl">
        <div className="card-header">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Settings2 className="w-4 h-4"/> 
            This page safely augments your existing Veo 3 feature. Use the JSON or text output below in your current pipeline.
          </div>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="idea" className="form-label flex items-center gap-2">
                <Sparkles className="w-4 h-4"/> Plain Idea
              </label>
              <textarea 
                id="idea" 
                value={idea} 
                onChange={(e)=>setIdea(e.target.value)} 
                rows={4} 
                className="form-input mt-2" 
                placeholder="Describe the video idea in plain language..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Product</label>
                <input value={product} onChange={(e)=>setProduct(e.target.value)} placeholder="Product name" className="form-input"/>
              </div>
              <div>
                <label className="form-label">Brand</label>
                <input value={brand} onChange={(e)=>setBrand(e.target.value)} placeholder="Brand name" className="form-input"/>
              </div>
              <div>
                <label className="form-label">Objective</label>
                <select value={objective} onChange={(e:any)=>setObjective(e.target.value)} className="form-select">
                  {(["awareness","consideration","conversion","ugc_ad","launch","howto"] as const).map(o=> (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Platform</label>
                <select value={platform} onChange={(e:any)=>setPlatform(e.target.value)} className="form-select">
                  {(["tiktok","instagram_reels","youtube_shorts","all"] as const).map(p=> (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Aspect</label>
                <select value={aspect} onChange={(e:any)=>setAspect(e.target.value)} className="form-select">
                  {(["9:16","1:1","16:9"] as const).map(a=> (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Duration (sec)</label>
                <input type="number" value={duration} min={6} max={60} onChange={(e)=>setDuration(parseInt(e.target.value||"0",10))} className="form-input"/>
              </div>
              <div className="col-span-2">
                <label className="form-label flex items-center gap-2">
                  <Palette className="w-4 h-4"/> Palette (comma or space separated)
                </label>
                <input value={palette} onChange={(e)=>setPalette(e.target.value)} placeholder="#000 #FFF #6C5CE7" className="form-input"/>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={voiceover} onChange={(e)=>setVoiceover(e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"/>
                <label className="form-label">Voiceover</label>
              </div>
              <div>
                <label className="form-label">Style Preset</label>
                <select value={styleName} onChange={(e)=>setStyleName(e.target.value)} className="form-select">
                  {STYLE_PRESETS.map(s => (<option key={s.name} value={s.name}>{s.name}</option>))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="card-header border-t">
          <div className="flex items-center gap-3">
            <button onClick={generate} disabled={busy} className="btn-primary gap-2">
              <Wand2 className="w-4 h-4"/>{busy?"Building...":"Generate"}
            </button>
            <button onClick={saveToDB} disabled={!jsonOut} className="btn-secondary gap-2">
              <Database className="w-4 h-4"/> Save to DB
            </button>
            <button onClick={exportToS3} disabled={!jsonOut} className="btn-secondary gap-2">
              <Cloud className="w-4 h-4"/> Export to S3
            </button>
            <button onClick={()=>useIndustry("SaaS App Demo")} className="btn-secondary gap-2">
              <RefreshCcw className="w-4 h-4"/> Load SaaS Demo
            </button>
            <button onClick={resetForm} className="btn-secondary gap-2">
              <Undo2 className="w-4 h-4"/> Reset
            </button>
            <div className="text-sm text-gray-600">Or try presets: {Object.keys(INDUSTRY_TEMPLATES).map(k => (
              <button key={k} onClick={()=>useIndustry(k)} className="underline ml-2">{k}</button>
            ))}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button className="flex-1 py-2 px-3 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm">JSON</button>
          <button className="flex-1 py-2 px-3 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900">Veo Instructions</button>
        </div>
        
        <div className="card rounded-2xl">
          <div className="card-body">
            <pre className="bg-gray-50 p-4 rounded-xl overflow-auto text-sm max-h-[420px]">
{jsonOut ? JSON.stringify(jsonOut, null, 2) : "Enter your idea above and click Generate to create a structured JSON prompt via AI"}
            </pre>
          </div>
          <div className="card-header border-t">
            <div className="flex gap-2">
              <button onClick={copyJSON} className="btn-secondary gap-2">
                <Copy className="w-4 h-4"/> Copy JSON
              </button>
              <button onClick={()=>download("json")} className="btn-primary gap-2">
                <Download className="w-4 h-4"/> Download JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card rounded-2xl">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Generated Veo Instructions</h3>
        </div>
        <div className="card-body">
          <pre className="bg-gray-50 p-4 rounded-xl overflow-auto text-sm max-h-[420px] whitespace-pre-wrap">
{textOut || "Generated instructions will appear here after clicking Generate"}
          </pre>
        </div>
        <div className="card-header border-t">
          <div className="flex gap-2">
            <button onClick={copyText} className="btn-secondary gap-2">
              <Copy className="w-4 h-4"/> Copy Instructions
            </button>
            <button onClick={()=>download("txt")} className="btn-primary gap-2">
              <Download className="w-4 h-4"/> Download Instructions
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-600 pb-8">
        Export the JSON or text and feed it into your existing Veo 3 pipeline to replace/augment your current prompts. 
        Store JSON + job IDs to allow exact regenerations and style remixes later.
      </div>
    </div>
  );
}
