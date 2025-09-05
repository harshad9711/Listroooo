"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Wand2, RefreshCcw, Copy, Sparkles, Film, FileJson, Type, Palette, Undo2, Settings2, History, UploadCloud, Send } from "lucide-react";
import { z } from "zod";

// UI (Tremor)
import { Card, Title, Text, Button, Select, SelectItem, TextInput, Badge, Tab, TabList, TabGroup, TabPanel, TabPanels } from '@tremor/react';

// Local logic
import { PromptSchema, type ListroVeoPrompt } from "@/lib/veo-schema";
import { renderVeoPrompt } from "@/lib/veo-render";
import { useApi } from "@/lib/useApi";

// Simple presets (optional, keep minimal here)
const STYLE_PRESETS = [
  { name: "Hollywood Cinematic", camera: "Anamorphic; 35/50mm; dolly", lighting: "Key+fill+hair", grade: "Filmic print", motion: "Tasteful ramps" },
  { name: "Fast Viral Ad", camera: "Handheld gimbal; whip pans", lighting: "High key", grade: "Clean, vibrant", motion: "Smash cuts" },
  { name: "Aesthetic Moodboard", camera: "Static + sliders; macro", lighting: "Window/golden hour", grade: "Warm, creamy", motion: "Dissolves" },
] as const;

export default function VeoBuilder(){
  const { apiCall } = useApi();
  const [idea, setIdea] = useState("Make a 20s dramatic launch video for our new cold brew can. Macro ice shots, moody lighting, quick city cutaways. CTA: 'Fuel your day'. Cool blue grade. Fast pace for TikTok.");
  const [product, setProduct] = useState("Glacier Cold Brew – 12oz Can");
  const [objective, setObjective] = useState<"awareness"|"consideration"|"conversion"|"ugc_ad"|"launch"|"howto">("awareness");
  const [platform, setPlatform] = useState<"tiktok"|"instagram_reels"|"youtube_shorts"|"all">("tiktok");
  const [aspect, setAspect] = useState<"9:16"|"1:1"|"16:9">("9:16");
  const [duration, setDuration] = useState(20);
  const [brand, setBrand] = useState("Listro");
  const [palette, setPalette] = useState("#0E1A2B, #2FA3D6, #FFFFFF");
  const [styleIdx, setStyleIdx] = useState(0);
  const [voiceover, setVoiceover] = useState(true);
  const [useServerLLM, setUseServerLLM] = useState(true);

  const [jsonOut, setJsonOut] = useState<ListroVeoPrompt | null>(null);
  const [textOut, setTextOut] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  // Saved prompt state
  const [promptId, setPromptId] = useState<string | null>(null);
  const [versions, setVersions] = useState<Array<{id:string,version:number,createdAt:string}> | null>(null);

  // apiCall is now provided by the useApi hook

  function resetForm(){
    setIdea(""); setProduct(""); setBrand(""); setPalette("#111111, #6C5CE7, #FFFFFF"); setObjective("awareness"); setPlatform("tiktok"); setAspect("9:16"); setDuration(20); setStyleIdx(0); setVoiceover(true); setJsonOut(null); setTextOut(""); setPromptId(null); setVersions(null);
  }

  async function generate(){
    setBusy(true);
    try {
      if (useServerLLM){
        const r = await apiCall("/api/veo/idea-to-json", { method: "POST", body: JSON.stringify({ idea }) });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Server error");
        setJsonOut(data.prompt);
        setTextOut(renderVeoPrompt(data.prompt));
      } else {
        // Minimal local fallback: build a tiny JSON from fields
        const local = {
          meta: { product, objective, duration_seconds: duration, aspect_ratio: aspect, platform, language: "en-US", tone: "cinematic, modern, confident" },
          story: { hook: idea.split(".")[0], beats: [ { t:0, duration: Math.max(3, Math.floor(duration/3)), action: "Hook visual", shot: "Macro" }, { t:5, duration: Math.max(3, Math.floor(duration/3)), action: "Feature montage", shot: "Gimbal" }, { t:10, duration: duration - (Math.max(3, Math.floor(duration/3))*2), action: "Hero + CTA", shot: "Static" } ], cta: "Shop now" },
          visuals: { camera: STYLE_PRESETS[styleIdx].camera, lighting: STYLE_PRESETS[styleIdx].lighting, color_grade: STYLE_PRESETS[styleIdx].grade, motion_style: STYLE_PRESETS[styleIdx].motion },
          audio: { music_style: "Electronic", voiceover_flag: voiceover, caption_style: "kinetic" },
          branding: { brand_name: brand, palette: palette.split(/[,\s]+/).filter(Boolean), font: "Inter" },
          deliverables: { exports: ["mp4"], captions_burned_in: true, captions_sidecar: true, sidecar_format: "srt" }
        } as unknown as ListroVeoPrompt;
        setJsonOut(local);
        setTextOut(renderVeoPrompt(local));
      }
    } catch (e:any){
      alert(e.message);
    } finally { setBusy(false); }
  }

  async function save(){
    if (!jsonOut) return alert("Generate first");
    const r = await apiCall("/api/veo/prompts", { method: "POST", body: JSON.stringify({ prompt: jsonOut, idea, promptId }) });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "Save failed");
    setPromptId(data?.id || data?.prompt?.id || promptId);
    alert("Saved");
  }

  async function loadVersions(){
    if (!promptId) return;
    const r = await apiCall(`/api/veo/prompts/${promptId}/versions`);
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "Load versions failed");
    setVersions(data);
  }

  async function rollback(version: number){
    if (!promptId) return;
    const r = await apiCall(`/api/veo/prompts/${promptId}/rollback`, { method: "POST", body: JSON.stringify({ version }) });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "Rollback failed");
    alert(`Rolled back to v${version}`);
  }

  async function exportS3(){
    if (!jsonOut) return alert("Generate first");
    const r = await apiCall("/api/veo/export", { method: "POST", body: JSON.stringify({ id: promptId || jsonOut.meta.product, json: jsonOut, instructionsText: textOut }) });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "Export failed");
    alert(`Signed URLs (10 min):\nJSON: ${data.jsonUrl}\nText: ${data.instructionsUrl ?? "(none)"}`);
  }

  async function sendToVeo(){
    if (!jsonOut) return alert("Generate first");
    const r = await apiCall("/api/veo/send", { method: "POST", body: JSON.stringify({ json: jsonOut, instructionsText: textOut }) });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "Veo send failed");
    alert(`Veo Job ID: ${data.jobId}`);
  }

  useEffect(()=>{ if (promptId) loadVersions(); }, [promptId]);

  const copyJSON = async () => { if (!jsonOut) return; await navigator.clipboard.writeText(JSON.stringify(jsonOut, null, 2)); setCopied(true); setTimeout(()=>setCopied(false), 1200); };
  const copyText = async () => { if (!textOut) return; await navigator.clipboard.writeText(textOut); setCopied(true); setTimeout(()=>setCopied(false), 1200); };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <motion.h1 initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <Film className="w-8 h-8"/> Veo 3 Builder — Pro
        <Badge variant="secondary" className="ml-2">Listro</Badge>
      </motion.h1>

      <Card className="shadow-sm border rounded-2xl">
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Settings2 className="w-4 h-4"/> Server LLM, user‑scoped saves, versioning, signed S3, send‑to‑Veo.
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Sparkles className="w-4 h-4"/> Plain Idea
              </label>
              <textarea 
                value={idea} 
                onChange={(e)=>setIdea(e.target.value)} 
                rows={4} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the video idea in plain language..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <TextInput value={product} onChange={(e)=>setProduct(e.target.value)} placeholder="Product name"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <TextInput value={brand} onChange={(e)=>setBrand(e.target.value)} placeholder="Brand name"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Objective</label>
                <Select value={objective} onValueChange={(v:any)=>setObjective(v)}>
                  {(["awareness","consideration","conversion","ugc_ad","launch","howto"] as const).map(o=> <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <Select value={platform} onValueChange={(v:any)=>setPlatform(v)}>
                  {(["tiktok","instagram_reels","youtube_shorts","all"] as const).map(p=> <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aspect</label>
                <Select value={aspect} onValueChange={(v:any)=>setAspect(v)}>
                  {(["9:16","1:1","16:9"] as const).map(a=> <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (sec)</label>
                <TextInput type="number" value={duration} min={6} max={60} onChange={(e)=>setDuration(parseInt(e.target.value||"0",10))}/>
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4"/> Palette (comma or space separated)
                </label>
                <TextInput value={palette} onChange={(e)=>setPalette(e.target.value)} placeholder="#000 #FFF #6C5CE7"/>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={voiceover} onChange={(e)=>setVoiceover(e.target.checked)} className="rounded"/>
                <label className="text-sm font-medium text-gray-700">Voiceover</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Style Preset</label>
                <Select value={String(styleIdx)} onValueChange={(v)=>setStyleIdx(Number(v))}>
                  {STYLE_PRESETS.map((s, i) => (<SelectItem key={s.name} value={String(i)}>{s.name}</SelectItem>))}
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={useServerLLM} onChange={(e)=>setUseServerLLM(e.target.checked)} className="rounded"/>
                <label className="text-sm font-medium text-gray-700">Use Server LLM</label>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 pt-0 flex flex-wrap items-center gap-3">
          <Button onClick={generate} disabled={busy} className="gap-2">
            <Wand2 className="w-4 h-4"/>{busy?"Building...":"Generate"}
          </Button>
          <Button variant="secondary" onClick={save} className="gap-2">
            <History className="w-4 h-4"/> Save (new version)
          </Button>
          <Button variant="secondary" onClick={exportS3} className="gap-2">
            <UploadCloud className="w-4 h-4"/> Export (signed S3)
          </Button>
          <Button variant="secondary" onClick={sendToVeo} className="gap-2">
            <Send className="w-4 h-4"/> Send to Veo
          </Button>
          <Button variant="light" onClick={resetForm} className="gap-2">
            <Undo2 className="w-4 h-4"/> Reset
          </Button>
          {promptId && (
            <Button variant="light" onClick={loadVersions} className="gap-2">
              <History className="w-4 h-4"/> Load versions
            </Button>
          )}
        </div>
      </Card>

      <TabGroup>
        <TabList>
          <Tab className="gap-2">
            <FileJson className="w-4 h-4"/> JSON
          </Tab>
          <Tab className="gap-2">
            <Type className="w-4 h-4"/> Veo Instructions
          </Tab>
        </TabList>
        <TabPanel>
          <Card className="rounded-2xl">
            <div className="p-4">
              <pre className="bg-gray-50 p-4 rounded-xl overflow-auto text-sm max-h-[420px]">{jsonOut ? JSON.stringify(jsonOut, null, 2) : "/* Click Generate */"}</pre>
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <Button variant="secondary" onClick={copyJSON} className="gap-2">
                <Copy className="w-4 h-4"/> {copied?"Copied!":"Copy JSON"}
              </Button>
              <Button onClick={()=>{ if(!jsonOut) return; const blob = new Blob([JSON.stringify(jsonOut, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `listro-veo-prompt.json`; a.click(); URL.revokeObjectURL(url); }} className="gap-2">
                <Download className="w-4 h-4"/> Download JSON
              </Button>
            </div>
          </Card>
        </TabPanel>
        <TabPanel>
          <Card className="rounded-2xl">
            <div className="p-4">
              <pre className="bg-gray-50 p-4 rounded-xl overflow-auto text-sm max-h-[420px] whitespace-pre-wrap">{textOut || "/* Click Generate */"}</pre>
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <Button variant="secondary" onClick={copyText} className="gap-2">
                <Copy className="w-4 h-4"/> {copied?"Copied!":"Copy Text"}
              </Button>
              <Button onClick={()=>{ if(!textOut) return; const blob = new Blob([textOut], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `listro-veo-instructions.txt`; a.click(); URL.revokeObjectURL(url); }} className="gap-2">
                <Download className="w-4 h-4"/> Download .txt
              </Button>
            </div>
          </Card>
        </TabPanel>
      </TabGroup>

      {promptId && versions && (
        <Card className="rounded-2xl">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4"/> Versions
            </div>
            <div className="text-sm text-gray-500 mb-2">Click a version to rollback.</div>
            <div className="flex flex-wrap gap-2">
              {versions.map(v => (
                <Button key={v.id} variant="secondary" size="sm" onClick={()=>rollback(v.version)}>v{v.version}</Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card className="rounded-2xl">
        <div className="p-6">
          <Title>Server LLM Prompt (for reference)</Title>
          <pre className="bg-gray-50 p-4 rounded-xl overflow-auto text-sm mt-4">{`You are Listro's Prompt Orchestrator. Convert the user's rough idea into a JSON object that matches the ListroVeoShortFormPrompt schema. Fill sensible defaults. Make sure total beat durations ≈ duration_seconds. Prefer 9:16 for TikTok/Reels. Use cinematic, brand-safe phrasing. Output ONLY JSON.`}</pre>
        </div>
      </Card>
    </div>
  );
}