#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Veo 3 Next.js project...\n');

// Create directories
const dirs = [
  'src/lib',
  'prisma',
  'src/app/api/veo/idea-to-json',
  'src/app/api/veo/prompts',
  'src/app/api/veo/prompts/[id]/versions',
  'src/app/api/veo/prompts/[id]/rollback',
  'src/app/api/veo/export',
  'src/app/api/veo/send',
  'src/app/api/veo/jobs/[id]',
  'src/app/api/veo/webhooks/job',
  'src/app/api/files/sign-upload',
  'src/app/api/files/sign-download',
  'src/app/api/images/generate',
  'src/app/api/media/tts',
  'src/app/api/media/captions'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Create files
const files = {
  'prisma/schema.prisma': `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model VeoPrompt {
  id               String              @id @default(cuid())
  title            String?             @db.VarChar(180)
  ideaHash         String
  userId           String?
  provider         String?
  activeVersionId  String?
  activeVersion    VeoPromptVersion?   @relation("ActiveVersion", fields: [activeVersionId], references: [id])
  versions         VeoPromptVersion[]
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  @@index([userId])
  @@unique([ideaHash, userId])
}

model VeoPromptVersion {
  id             String   @id @default(cuid())
  promptId       String
  version        Int
  meta           Json
  story          Json
  visuals        Json
  audio          Json
  branding       Json
  deliverables   Json
  providerJobId  String?  // set when sending to Veo
  providerStatus String?
  assets         Json?
  createdAt      DateTime @default(now())

  prompt         VeoPrompt @relation(fields: [promptId], references: [id])

  @@unique([promptId, version])
}`,

  'src/lib/prisma.ts': `import { PrismaClient } from "@prisma/client";
const g = global as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;`,

  'src/lib/auth-supabase.ts': `import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getSupabaseUserIdFromCookies(): Promise<string | null> {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getSupabaseUserIdFromBearer(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const supabase = createClient(supabaseUrl, supabaseAnon, { auth: { persistSession: false } });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return user?.id ?? null;
}`,

  'src/lib/auth.ts': `import type { NextRequest } from "next/server";
import { getSupabaseUserIdFromCookies, getSupabaseUserIdFromBearer } from "./auth-supabase";
export async function getUserId(req?: NextRequest): Promise<string> {
  try { const uid = await getSupabaseUserIdFromCookies(); if (uid) return uid; } catch {}
  if (req) { const uid = await getSupabaseUserIdFromBearer(req); if (uid) return uid; }
  return "demo-user";
}`,

  'src/lib/veo-schema.ts': `import { z } from "zod";
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
export type ListroVeoPrompt = z.infer<typeof PromptSchema>;
export type Beat = z.infer<typeof BeatSchema>;
export function normalizeBeats(metaDuration: number, beats: Beat[]): Beat[] {
  const sum = beats.reduce((a,b)=>a+(b.duration||0),0);
  if (sum <= 0) return beats;
  const scale = metaDuration / sum;
  const scaled = beats.map((b) => ({ ...b, duration: Math.max(1, Math.round((b.duration||1) * scale)) }));
  let cursor = 0;
  const retimed = scaled.map(b => { const out = { ...b, t: cursor } as Beat; cursor += b.duration; return out; });
  const drift = cursor - metaDuration;
  if (drift !== 0 && retimed.length) retimed[retimed.length-1].duration = Math.max(1, retimed[retimed.length-1].duration - drift);
  cursor = 0;
  return retimed.map(b => { const out = { ...b, t: cursor } as Beat; cursor += b.duration; return out; });
}`,

  'src/lib/veo-render.ts': `import type { ListroVeoPrompt } from "./veo-schema";
export function renderVeoPrompt(p: ListroVeoPrompt){
  const L: string[] = [];
  L.push(\`Title: Cinematic Short-Form Ad for \${p.meta.product} (\${p.meta.aspect_ratio}, \${p.meta.duration_seconds}s)\`);
  L.push(""); L.push(\`Objective: \${p.meta.objective} on \${p.meta.platform}; tone \${p.meta.tone}, language \${p.meta.language}.\`);
  L.push(""); L.push("Cinematography:");
  L.push(\`- Camera: \${p.visuals.camera}\`); L.push(\`- Lighting: \${p.visuals.lighting}\`);
  L.push(\`- Color Grade: \${p.visuals.color_grade}\`); L.push(\`- Motion: \${p.visuals.motion_style}\`);
  if (p.visuals.negative_prompts) L.push(\`- Avoid: \${p.visuals.negative_prompts}\`);
  L.push(""); L.push("Audio:");
  L.push(\`- Music: \${p.audio.music_style}\${p.audio.music_bpm_target ? \` at ~\${p.audio.music_bpm_target} BPM\` : ""}\`);
  L.push(\`- Voiceover: \${p.audio.voiceover_flag ? (p.audio.voice_profile || "Yes") : "No VO"}\`);
  if (p.audio.sfx_notes) L.push(\`- SFX: \${p.audio.sfx_notes}\`); if (p.audio.caption_style) L.push(\`- Captions: \${p.audio.caption_style}\`);
  L.push(""); L.push("Branding:");
  L.push(\`- Brand: \${p.branding.brand_name}\`); if (p.branding.palette?.length) L.push(\`- Palette: \${p.branding.palette.join(", ")}\`);
  if (p.branding.font) L.push(\`- Font: \${p.branding.font}\`); if (p.branding.logo_url) L.push(\`- Logo: \${p.branding.logo_url}\`);
  if (p.branding.product_urls?.length) L.push(\`- Product URLs: \${p.branding.product_urls.join(", ")}\`);
  L.push(""); L.push("Story Beats (timecoded):");
  p.story.beats.forEach(b => { L.push(\`- t=\${b.t}s (\${b.duration}s): \${b.action} | Shot: \${b.shot}\`);
    if (b.on_screen_text) L.push(\`  Text: "\${b.on_screen_text}"\`); if (b.voiceover) L.push(\`  VO: "\${b.voiceover}"\`);
    if (b.product_callout) L.push(\`  Callout: \${b.product_callout}\`); });
  if (p.story.hook){ L.push(""); L.push(\`Hook: \${p.story.hook}\`); }
  if (p.story.cta){ L.push(\`CTA: \${p.story.cta}\`); }
  L.push(""); L.push("Deliverables:");
  L.push(\`- Exports: \${p.deliverables.exports.join(", ")}; Captions burned in: \${p.deliverables.captions_burned_in}; Sidecar: \${p.deliverables.captions_sidecar} (\${p.deliverables.sidecar_format})\`);
  if (p.deliverables.thumbnail_prompts?.length) L.push(\`- Thumbnail ideas: \${p.deliverables.thumbnail_prompts.join(" | ")}\`);
  return L.join("\\n");
}`,

  'src/lib/veo-storage.ts': `import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET_NAME!;
export async function putPrivateText(key: string, body: string, contentType = "text/plain"){ 
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));
  return key;
}
export async function signedGetUrl(key: string, expiresIn = 600){
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}
export async function signedPutUrl(key: string, contentType = "application/octet-stream", expiresIn = 600){
  return getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), { expiresIn });
}`,

  'src/lib/veo-llm.ts': `import { type ListroVeoPrompt, PromptSchema, normalizeBeats } from "@/lib/veo-schema";
import crypto from "node:crypto";
const SYSTEM_INSTR = \`You are Listro's Prompt Orchestrator. Convert the user's rough idea into a JSON object that matches the ListroVeoShortFormPrompt schema. Fill sensible defaults. Make sure total beat durations ≈ duration_seconds. Prefer 9:16 for TikTok/Reels. Use cinematic, brand-safe phrasing. Output ONLY JSON.\`;
export async function ideaToJsonViaOpenAI(idea: string): Promise<ListroVeoPrompt> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_INSTR }, { role: "user", content: idea }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    }),
  });
  const raw = await r.text();
  if (!r.ok) {
    let err = raw; try { const j = JSON.parse(raw); err = j?.error?.message || raw; } catch {}
    throw new Error(\`OpenAI \${r.status}: \${err}\`);
  }
  const parsed = raw ? JSON.parse(raw) : {};
  const text = parsed?.choices?.[0]?.message?.content ?? "{}";
  const obj = PromptSchema.parse(JSON.parse(text));
  obj.story.beats = normalizeBeats(obj.meta.duration_seconds, obj.story.beats as any);
  return obj;
}
export function hashIdea(s: string){ return crypto.createHash("sha256").update(s.trim()).digest("hex"); }`,

  'src/lib/useApi.tsx': `"use client";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
async function safeJson(res: Response) {
  const text = await res.text(); if (!text) return null;
  try { return JSON.parse(text); } catch { throw new Error(\`Non-JSON response (status \${res.status}): \${text.slice(0,400)}\`); }
}
export function useApi() {
  const supabase = useSupabaseClient();
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: \`Bearer \${session.access_token}\` } : {}), ...(options.headers || {}) };
    const res = await fetch(url, { ...options, headers });
    const data = await safeJson(res);
    if (!res.ok) { const msg = (data && (data.error || data.message)) || \`HTTP \${res.status}\`; throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg)); }
    return { res, data };
  };
  return { apiCall };
}`
};

// Write all files
Object.entries(files).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
  console.log(`📄 Created file: ${filePath}`);
});

console.log('\n✅ Setup complete!');
console.log('\nNext steps:');
console.log('1. Copy env.example to .env.local and configure your environment variables');
console.log('2. Run: npm run db:migrate (to set up the database)');
console.log('3. Run: npm run dev (to start the development server)');
console.log('4. Visit http://localhost:3000 to test the application');
