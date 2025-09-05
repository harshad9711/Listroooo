import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Wand2, RefreshCcw, Copy, Sparkles, Film, FileJson, Type, Palette, Undo2, Settings2, History, UploadCloud, Send } from "lucide-react";
import { Card, Title, Text, Button, Select, SelectItem, TextInput, Badge, Tab, TabList, TabGroup, TabPanel, TabPanels } from '@tremor/react';
import type { ListroVeoPrompt } from "@/lib/veo-schema";
import { renderVeoPrompt } from "@/lib/veo-render";
import { useApi } from "@/lib/useApi";

const STYLE_PRESETS = [
  { name: "Hollywood Cinematic", camera: "Anamorphic; 35/50mm; dolly", lighting: "Key+fill+hair", grade: "Filmic print", motion: "Tasteful ramps" },
  { name: "Fast Viral Ad", camera: "Handheld gimbal; whip pans", lighting: "High key", grade: "Clean, vibrant", motion: "Smash cuts" },
  { name: "Aesthetic Moodboard", camera: "Static + sliders; macro", lighting: "Window/golden hour", grade: "Warm, creamy", motion: "Dissolves" },
] as const;

export default function VeoBuilderPro(){
  const { apiCall } = useApi();

  // Add custom styles for solid, opaque dropdown options
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Force solid, opaque dropdown backgrounds - multiple selectors to ensure coverage */
      [data-radix-popper-content-wrapper],
      [data-radix-popper-content-wrapper] > div,
      [data-radix-popper-content-wrapper] [role="listbox"],
      [data-radix-popper-content-wrapper] [role="menu"],
      [data-radix-popper-content-wrapper] [role="listbox"] > div {
        background: #ffffff !important;
        background-color: #ffffff !important;
        opacity: 1 !important;
        border: 1px solid #e5e7eb !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        border-radius: 8px !important;
      }
      
      [data-radix-popper-content-wrapper] [role="option"],
      [data-radix-popper-content-wrapper] [role="menuitem"],
      [data-radix-popper-content-wrapper] [role="option"] > div,
      [data-radix-popper-content-wrapper] [role="menuitem"] > div {
        color: #000000 !important;
        background: #ffffff !important;
        background-color: #ffffff !important;
        opacity: 1 !important;
        padding: 8px 12px !important;
        border-bottom: 1px solid #f3f4f6 !important;
      }
      
      [data-radix-popper-content-wrapper] [role="option"]:hover,
      [data-radix-popper-content-wrapper] [role="menuitem"]:hover {
        background: #f9fafb !important;
        background-color: #f9fafb !important;
        color: #000000 !important;
        opacity: 1 !important;
      }
      
      [data-radix-popper-content-wrapper] [role="option"]:last-child,
      [data-radix-popper-content-wrapper] [role="menuitem"]:last-child {
        border-bottom: none !important;
      }
      
      /* Tremor-specific selectors */
      .tremor-SelectContent,
      .tremor-SelectContent > div {
        background: #ffffff !important;
        background-color: #ffffff !important;
        opacity: 1 !important;
        border: 1px solid #e5e7eb !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        border-radius: 8px !important;
      }
      
      .tremor-SelectItem,
      .tremor-SelectItem > div {
        color: #000000 !important;
        background: #ffffff !important;
        background-color: #ffffff !important;
        opacity: 1 !important;
        padding: 8px 12px !important;
        border-bottom: 1px solid #f3f4f6 !important;
      }
      
      .tremor-SelectItem:hover {
        background: #f9fafb !important;
        background-color: #f9fafb !important;
        color: #000000 !important;
        opacity: 1 !important;
      }
      
      .tremor-SelectItem:last-child {
        border-bottom: none !important;
      }
      
      /* Additional generic selectors for any dropdown */
      [role="listbox"] {
        background: #ffffff !important;
        background-color: #ffffff !important;
        opacity: 1 !important;
      }
      
      [role="option"] {
        background: #ffffff !important;
        background-color: #ffffff !important;
        opacity: 1 !important;
        color: #000000 !important;
      }
      
      /* Force remove any transparency */
      *[style*="opacity"] {
        opacity: 1 !important;
      }
      
      *[style*="background"] {
        background: #ffffff !important;
        background-color: #ffffff !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  const [jsonOut, setJsonOut] = useState<ListroVeoPrompt | null>(null);
  const [textOut, setTextOut] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const [promptId, setPromptId] = useState<string | null>(null);
  const [versions, setVersions] = useState<Array<{id:string,version:number,createdAt:string}> | null>(null);
  
  // New state for prompt management
  const [savedPrompts, setSavedPrompts] = useState<Array<{id:string,title:string,updatedAt:string,activeVersion:any}> | null>(null);
  const [templates, setTemplates] = useState<Array<{id:string,title:string,updatedAt:string,activeVersion:any}> | null>(null);
  const [showPromptManager, setShowPromptManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedObjective, setSelectedObjective] = useState<string>("all");

  function resetForm(){
    setIdea(""); setProduct(""); setBrand(""); setPalette("#111111, #6C5CE7, #FFFFFF");
    setObjective("awareness"); setPlatform("tiktok"); setAspect("9:16"); setDuration(20);
    setStyleIdx(0); setVoiceover(true); setJsonOut(null); setTextOut(""); setPromptId(null); setVersions(null);
  }

  async function generate(){
    setBusy(true);
    try {
      const { data } = await apiCall("/api/veo/idea-to-json", {
        method: "POST",
        body: JSON.stringify({ idea }),
      });
      setJsonOut(data.prompt);
      setTextOut(renderVeoPrompt(data.prompt));
    } catch (e:any) {
      alert(e.message);
    } finally { setBusy(false); }
  }

  async function save(){
    if (!jsonOut) return alert("Generate first");
    try {
      const { data } = await apiCall("/api/veo/prompts", { 
        method: "POST", 
        body: JSON.stringify({ prompt: jsonOut, idea, promptId }) 
      });
      setPromptId(data?.id || data?.prompt?.id || promptId);
      alert("Saved");
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function loadVersions(){
    if (!promptId) return;
    try {
      const { data } = await apiCall(`/api/veo/prompts/${promptId}/versions`);
      setVersions(data);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function rollback(version: number){
    if (!promptId) return;
    try {
      const { data } = await apiCall(`/api/veo/prompts/${promptId}/rollback`, { 
        method: "POST", 
        body: JSON.stringify({ version }) 
      });
      setJsonOut(data.prompt);
      setTextOut(renderVeoPrompt(data.prompt));
      loadVersions();
      alert(`Rolled back to v${version}`);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function exportS3(){
    if (!jsonOut) return alert("Generate first");
    try {
      const { data } = await apiCall("/api/veo/export", { 
        method: "POST", 
        body: JSON.stringify({ id: promptId || jsonOut.meta.product, json: jsonOut, instructionsText: textOut }) 
      });
      alert(`Signed URLs (10 min):\nJSON: ${data.jsonUrl}\nText: ${data.instructionsUrl ?? "(none)"}`);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function sendToVeo(){
    if (!jsonOut) return alert("Generate first");
    try {
      const { data } = await apiCall("/api/veo/send", { 
        method: "POST", 
        body: JSON.stringify({ json: jsonOut, instructionsText: textOut }) 
      });
      alert(`Veo Job ID: ${data.jobId}`);
    } catch (e: any) {
      alert(e.message);
    }
  }

  // New prompt management functions
  async function loadSavedPrompts(){
    try {
      const { data } = await apiCall("/api/veo/prompts");
      setSavedPrompts(data);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function loadTemplates(){
    try {
      const { data } = await apiCall("/api/veo/templates");
      setTemplates(data);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function loadPrompt(promptId: string){
    try {
      const { data } = await apiCall(`/api/veo/prompts/${promptId}`);
      setJsonOut(data.activeVersion);
      setTextOut(renderVeoPrompt(data.activeVersion));
      setPromptId(promptId);
      loadVersions();
      setShowPromptManager(false);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function loadTemplate(templateId: string){
    try {
      const { data } = await apiCall(`/api/veo/templates/${templateId}/load`, { method: "POST" });
      setJsonOut(data);
      setTextOut(renderVeoPrompt(data));
      setPromptId(null); // Templates don't have versions
      setVersions(null);
      setShowPromptManager(false);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function deletePrompt(promptId: string){
    if (!confirm("Delete this prompt? This action cannot be undone.")) return;
    try {
      await apiCall(`/api/veo/prompts/${promptId}`, { method: "DELETE" });
      loadSavedPrompts();
      if (promptId === promptId) {
        resetForm();
      }
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function saveAsTemplate(){
    if (!jsonOut) return alert("Generate first");
    const name = prompt("Enter template name:");
    if (!name) return;
    try {
      await apiCall("/api/veo/templates", { 
        method: "POST", 
        body: JSON.stringify({ name, description: "", prompt: jsonOut }) 
      });
      loadTemplates();
      alert("Template saved!");
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function searchPrompts(){
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedPlatform !== "all") params.append("platform", selectedPlatform);
      if (selectedObjective !== "all") params.append("objective", selectedObjective);
      
      const { data } = await apiCall(`/api/veo/prompts?${params.toString()}`);
      setSavedPrompts(data);
    } catch (e: any) {
      alert(e.message);
    }
  }

  useEffect(()=>{ if (promptId) loadVersions(); }, [promptId]);

  const copyJSON = async () => { if (!jsonOut) return; await navigator.clipboard.writeText(JSON.stringify(jsonOut, null, 2)); setCopied(true); setTimeout(()=>setCopied(false),1200); };
  const copyText = async () => { if (!textOut) return; await navigator.clipboard.writeText(textOut); setCopied(true); setTimeout(()=>setCopied(false),1200); };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <motion.h1 initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <Film className="w-8 h-8"/> Veo 3 Builder — Pro <Badge variant="secondary" className="ml-2">Listro</Badge>
      </motion.h1>

      <Card className="shadow-sm border rounded-2xl">
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Settings2 className="w-4 h-4"/> Server LLM (OpenAI), user-scoped saves, versioning, signed S3, send-to-Veo.
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
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Product</label><TextInput value={product} onChange={(e)=>setProduct(e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Brand</label><TextInput value={brand} onChange={(e)=>setBrand(e.target.value)} /></div>
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
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Duration (sec)</label><TextInput type="number" value={duration} min={6} max={60} onChange={(e)=>setDuration(parseInt(e.target.value||"0",10))}/></div>
              <div className="col-span-2"><label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Palette className="w-4 h-4"/> Palette</label><TextInput value={palette} onChange={(e)=>setPalette(e.target.value)} /></div>
              <div className="flex items-center gap-3"><input type="checkbox" checked={voiceover} onChange={(e)=>setVoiceover(e.target.checked)} className="rounded"/><label className="text-sm font-medium text-gray-700">Voiceover</label></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Style Preset</label>
                <Select value={String(styleIdx)} onValueChange={(v)=>setStyleIdx(Number(v))}>
                  {STYLE_PRESETS.map((s, i) => (<SelectItem key={s.name} value={String(i)}>{s.name}</SelectItem>))}
                </Select>
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
          <Button variant="light" onClick={() => { setShowPromptManager(true); loadSavedPrompts(); loadTemplates(); }} className="gap-2">
            <History className="w-4 h-4"/> Load Prompts
          </Button>
          <Button variant="light" onClick={saveAsTemplate} className="gap-2">
            <Settings2 className="w-4 h-4"/> Save as Template
          </Button>
          {promptId && (<Button variant="light" onClick={loadVersions} className="gap-2"><History className="w-4 h-4"/> Load versions</Button>)}
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
              {versions.map(v => (<Button key={v.id} variant="secondary" size="sm" onClick={()=>rollback(v.version)}>v{v.version}</Button>))}
            </div>
          </div>
        </Card>
      )}

      {/* Prompt Manager Modal */}
      {showPromptManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Prompt Manager</h2>
              <Button variant="light" onClick={() => setShowPromptManager(false)}>×</Button>
            </div>
            
            {/* Search and Filters */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <TextInput 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search prompts..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram_reels">Instagram Reels</SelectItem>
                  <SelectItem value="youtube_shorts">YouTube Shorts</SelectItem>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Objective</label>
                <Select value={selectedObjective} onValueChange={setSelectedObjective}>
                  <SelectItem value="all">All Objectives</SelectItem>
                  <SelectItem value="awareness">Awareness</SelectItem>
                  <SelectItem value="consideration">Consideration</SelectItem>
                  <SelectItem value="conversion">Conversion</SelectItem>
                  <SelectItem value="ugc_ad">UGC Ad</SelectItem>
                  <SelectItem value="launch">Launch</SelectItem>
                  <SelectItem value="howto">How-to</SelectItem>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={searchPrompts} className="w-full">Search</Button>
              </div>
            </div>

            <TabGroup>
              <TabList>
                <Tab>Saved Prompts ({savedPrompts?.length || 0})</Tab>
                <Tab>Templates ({templates?.length || 0})</Tab>
              </TabList>
              
              <TabPanel>
                <div className="space-y-3">
                  {savedPrompts?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No saved prompts found</div>
                  ) : (
                    savedPrompts?.map((prompt) => (
                      <Card key={prompt.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{prompt.title}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(prompt.updatedAt).toLocaleDateString()} • 
                              {prompt.activeVersion?.meta?.platform || 'Unknown'} • 
                              {prompt.activeVersion?.meta?.objective || 'Unknown'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => loadPrompt(prompt.id)}>
                              Load
                            </Button>
                            <Button size="sm" variant="light" onClick={() => deletePrompt(prompt.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabPanel>
              
              <TabPanel>
                <div className="space-y-3">
                  {templates?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No templates found</div>
                  ) : (
                    templates?.map((template) => (
                      <Card key={template.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{template.title}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(template.updatedAt).toLocaleDateString()} • 
                              {template.activeVersion?.meta?.platform || 'Unknown'} • 
                              {template.activeVersion?.meta?.objective || 'Unknown'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => loadTemplate(template.id)}>
                              Load
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabPanel>
            </TabGroup>
          </div>
        </div>
      )}
    </div>
  );
}
