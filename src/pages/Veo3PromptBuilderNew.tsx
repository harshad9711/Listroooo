"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, Wand2, Copy, Sparkles, Film, FileJson, Type, Palette, RefreshCcw, Undo2, Settings2, Database, Cloud } from "lucide-react";

// Import from existing lib files with correct paths
import { PromptSchema, normalizeBeats } from "../lib/veo-schema";
import type { ListroVeoPrompt, Beat } from "../lib/veo-schema";

type Objective = "awareness" | "consideration" | "conversion" | "ugc_ad" | "launch" | "howto";
type Platform = "tiktok" | "instagram_reels" | "youtube_shorts" | "all";
type Aspect = "9:16" | "1:1" | "16:9";

const STYLE_PRESETS = ["Hollywood Cinematic", "Fast Viral Ad", "Aesthetic Moodboard"] as const;

// Render function (same as your working version)
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

export default function Page() {
  // Form state
  const [idea, setIdea] = useState(
    "Make a 20s dramatic launch video for our new cold brew can. Macro ice shots, moody lighting, quick city cutaways. CTA: 'Fuel your day'. Cool blue grade. Fast pace for TikTok."
  );
  const [product, setProduct] = useState("Glacier Cold Brew – 12oz Can");
  const [objective, setObjective] = useState<Objective>("awareness");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [duration, setDuration] = useState<number>(20);
  const [brand, setBrand] = useState("Listro");
  const [palette, setPalette] = useState("#0E1A2B, #2FA3D6, #FFFFFF");
  const [styleName, setStyleName] = useState<typeof STYLE_PRESETS[number]>(STYLE_PRESETS[0]);
  const [voiceover, setVoiceover] = useState(true);

  // Output state
  const [jsonOut, setJsonOut] = useState<ListroVeoPrompt | null>(null);
  const [textOut, setTextOut] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"json" | "text" | null>(null);

  // Compose a single idea string so the LLM receives all constraints
  function buildServerIdea(): string {
    const parts = [
      idea?.trim() || "",
      `Constraints: duration=${duration}s, aspect=${aspect}, platform=${platform}, objective=${objective}, voiceover=${voiceover ? "yes" : "no"}.`,
      product ? `Product: ${product}.` : "",
      brand ? `Brand: ${brand}.` : "",
      palette ? `Brand palette: ${palette}.` : "",
      styleName ? `Style preset: ${styleName}.` : "",
      "Return ONLY JSON conforming to the ListroVeoShortFormPrompt schema."
    ];
    return parts.filter(Boolean).join(" ");
  }

  async function generate() {
    setBusy(true);
    try {
      const composedIdea = buildServerIdea();
      const r = await fetch("/api/veo/idea-to-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: composedIdea })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to generate prompt");
      const json = data.prompt as ListroVeoPrompt;
      setJsonOut(json);
      setTextOut(renderVeoPrompt(json));
    } catch (e: any) {
      console.error(e);
      setTextOut(`Error: ${e.message || "An error occurred while generating the prompt."}`);
    } finally {
      setBusy(false);
    }
  }

  async function saveToDB() {
    try {
      if (!jsonOut) return setTextOut(prev => prev + "\n\n❌ Generate first.");
      const composedIdea = buildServerIdea();
      const r = await fetch("/api/veo/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: jsonOut, idea: composedIdea })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Save failed");
      console.log("Saved to DB:", data.id);
      setTextOut(prev => prev + `\n\n✅ Saved to database with ID: ${data.id}`);
    } catch (e: any) {
      console.error(e);
      setTextOut(prev => prev + `\n\n❌ Save failed: ${e.message}`);
    }
  }

  async function exportToS3() {
    try {
      if (!jsonOut) return setTextOut(prev => prev + "\n\n❌ Generate first.");
      const r = await fetch("/api/veo/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: jsonOut.meta?.product || "veo-prompt",
          json: jsonOut,
          instructionsText: textOut
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Export failed");
      const { jsonUrl, instructionsUrl } = data;
      console.log("Exported to S3:", data);
      setTextOut(prev => prev + `\n\n✅ Exported to S3:\nJSON: ${jsonUrl}\nInstructions: ${instructionsUrl || "N/A"}`);
    } catch (e: any) {
      console.error(e);
      setTextOut(prev => prev + `\n\n❌ Export failed: ${e.message}`);
    }
  }

  async function copyJSON() {
    if (!jsonOut) return;
    await navigator.clipboard.writeText(JSON.stringify(jsonOut, null, 2));
    setCopied("json");
    setTimeout(() => setCopied(null), 1200);
  }
  
  async function copyText() {
    if (!textOut) return;
    await navigator.clipboard.writeText(textOut);
    setCopied("text");
    setTimeout(() => setCopied(null), 1200);
  }

  function download(type: "json" | "txt") {
    const blob = new Blob(
      [type === "json" ? JSON.stringify(jsonOut, null, 2) : textOut],
      { type: type === "json" ? "application/json" : "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = type === "json" ? `listro-veo-prompt.json` : `listro-veo-instructions.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetForm() {
    setIdea(""); 
    setProduct(""); 
    setBrand(""); 
    setPalette("#111111, #6C5CE7, #FFFFFF"); 
    setObjective("awareness"); 
    setPlatform("tiktok"); 
    setAspect("9:16"); 
    setDuration(20); 
    setStyleName(STYLE_PRESETS[0]); 
    setVoiceover(true); 
    setJsonOut(null); 
    setTextOut("");
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold tracking-tight flex items-center gap-2"
      >
        <Film className="w-8 h-8" /> Veo 3 Cinematic Prompt Builder
        <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
          Listro
        </span>
      </motion.h1>

      <div className="card shadow-sm border rounded-2xl">
        <div className="card-header">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Settings2 className="w-4 h-4"/> 
            This page uses your live backend (LLM, Prisma, S3). Generate → Save to DB → Export.
          </div>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="idea" className="form-label flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Plain Idea
              </label>
              <textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={5}
                className="form-input mt-2"
                placeholder="Describe the video idea in plain language..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Product</label>
                <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Product name" className="form-input"/>
              </div>
              <div>
                <label className="form-label">Brand</label>
                <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand name" className="form-input"/>
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
                  <Palette className="w-4 h-4" /> Palette (comma or space separated)
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
                  {STYLE_PRESETS.map(s => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="card-header border-t">
          <div className="flex items-center gap-3">
            <button onClick={generate} disabled={busy} className="btn-primary gap-2">
              <Wand2 className="w-4 h-4"/>{busy?"Generating...":"Generate"}
            </button>
            <button onClick={saveToDB} disabled={!jsonOut} className="btn-secondary gap-2">
              <Database className="w-4 h-4"/> Save to DB
            </button>
            <button onClick={exportToS3} disabled={!jsonOut} className="btn-secondary gap-2">
              <Cloud className="w-4 h-4"/> Export to S3
            </button>
            <button onClick={resetForm} className="btn-secondary gap-2">
              <Undo2 className="w-4 h-4"/> Reset
            </button>
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
{jsonOut ? JSON.stringify(jsonOut, null, 2) : "// Click Generate to create a structured JSON prompt"}
            </pre>
          </div>
          <div className="card-header border-t">
            <div className="flex gap-2">
              <button onClick={copyJSON} className="btn-secondary gap-2">
                <Copy className="w-4 h-4"/> {copied === "json" ? "Copied!" : "Copy JSON"}
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
{textOut || "// Click Generate to render Veo instructions"}
          </pre>
        </div>
        <div className="card-header border-t">
          <div className="flex gap-2">
            <button onClick={copyText} className="btn-secondary gap-2">
              <Copy className="w-4 h-4"/> {copied === "text" ? "Copied!" : "Copy Text"}
            </button>
            <button onClick={()=>download("txt")} className="btn-primary gap-2">
              <Download className="w-4 h-4"/> Download .txt
            </button>
          </div>
        </div>
      </div>

      <div className="card rounded-2xl">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Server LLM prompt (for reference)</h3>
        </div>
        <div className="card-body">
          <pre className="bg-gray-50 p-4 rounded-xl overflow-auto text-sm">
{`System:
You are Listro's Prompt Orchestrator. Convert the user's rough idea into a JSON object that matches the ListroVeoShortFormPrompt schema. Fill sensible defaults. Make sure total beat durations ≈ duration_seconds. Prefer 9:16 for TikTok/Reels. Use cinematic, brand-safe phrasing.

User idea:
"<COMPOSED_IDEA_FROM_FORM>"

Output:
(ONLY valid JSON, no prose).`}
          </pre>
        </div>
      </div>
    </div>
  );
}
