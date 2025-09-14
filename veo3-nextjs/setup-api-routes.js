#!/usr/bin/env node

const fs = require('fs');

console.log('🚀 Creating API routes...\n');

const apiRoutes = {
  'src/app/api/veo/idea-to-json/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { ideaToJsonViaOpenAI, hashIdea } from "@/lib/veo-llm";
import { PromptSchema } from "@/lib/veo-schema";
import { getUserId } from "@/lib/auth";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest){
  const userId = await getUserId(req);
  if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  try {
    const bodyText = await req.text(); const { idea } = bodyText ? JSON.parse(bodyText) : {};
    if (!idea || typeof idea !== "string") return NextResponse.json({ error: "Missing 'idea' (string)" }, { status: 400 });
    const prompt = await ideaToJsonViaOpenAI(idea);
    const safe = PromptSchema.parse(prompt);
    return NextResponse.json({ prompt: safe, ideaHash: hashIdea(idea) }, { status: 200 });
  } catch (e:any){ return NextResponse.json({ error: e?.message || "LLM failure" }, { status: 500 }); }
}`,

  'src/app/api/veo/prompts/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; import { getUserId } from "@/lib/auth";
import { PromptSchema } from "@/lib/veo-schema"; import { hashIdea } from "@/lib/veo-llm";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(req: NextRequest){
  const userId = await getUserId(req); if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.veoPrompt.findMany({ where: { userId }, include: { activeVersion: true }, orderBy: { updatedAt: "desc" }, take: 50 });
  return NextResponse.json(rows);
}
export async function POST(req: NextRequest){
  const userId = await getUserId(req); if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json(); const { prompt, idea, promptId } = body;
  const parsed = PromptSchema.parse(prompt);
  const ideaHash = idea ? hashIdea(idea) : (body.ideaHash || "no-idea");
  if (promptId){
    const existing = await prisma.veoPrompt.findUnique({ where: { id: promptId } });
    if (!existing || existing.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const last = await prisma.veoPromptVersion.findFirst({ where: { promptId }, orderBy: { version: "desc" } });
    const nextVersion = (last?.version ?? 0) + 1;
    const v = await prisma.veoPromptVersion.create({ data: { promptId, version: nextVersion, meta: parsed.meta, story: parsed.story, visuals: parsed.visuals, audio: parsed.audio, branding: parsed.branding, deliverables: parsed.deliverables } });
    const updated = await prisma.veoPrompt.update({ where: { id: promptId }, data: { title: parsed.meta.product.slice(0,180), activeVersionId: v.id } });
    return NextResponse.json({ prompt: updated, version: v });
  }
  const created = await prisma.veoPrompt.create({ data: { userId, ideaHash, title: parsed.meta.product.slice(0,180), provider: "openai" } });
  const v1 = await prisma.veoPromptVersion.create({ data: { promptId: created.id, version: 1, meta: parsed.meta, story: parsed.story, visuals: parsed.visuals, audio: parsed.audio, branding: parsed.branding, deliverables: parsed.deliverables } });
  const updated = await prisma.veoPrompt.update({ where: { id: created.id }, data: { activeVersionId: v1.id }, include: { activeVersion: true } });
  return NextResponse.json(updated);
}`,

  'src/app/api/veo/prompts/[id]/versions/route.ts': `import { NextRequest, NextResponse } from "next/server"; import { prisma } from "@/lib/prisma"; import { getUserId } from "@/lib/auth";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(req: NextRequest, { params }: { params: { id: string }}) {
  const userId = await getUserId(req);
  const root = await prisma.veoPrompt.findUnique({ where: { id: params.id } });
  if (!root || root.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const versions = await prisma.veoPromptVersion.findMany({ where: { promptId: params.id }, orderBy: { version: "desc" } });
  return NextResponse.json(versions);
}`,

  'src/app/api/veo/prompts/[id]/rollback/route.ts': `import { NextRequest, NextResponse } from "next/server"; import { prisma } from "@/lib/prisma"; import { getUserId } from "@/lib/auth";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest, { params }: { params: { id: string }}) {
  const userId = await getUserId(req);
  const { version } = await req.json();
  const root = await prisma.veoPrompt.findUnique({ where: { id: params.id } });
  if (!root || root.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const v = await prisma.veoPromptVersion.findUnique({ where: { promptId_version: { promptId: params.id, version } } });
  if (!v) return NextResponse.json({ error: "Version not found" }, { status: 404 });
  const updated = await prisma.veoPrompt.update({ where: { id: params.id }, data: { activeVersionId: v.id } });
  return NextResponse.json(updated);
}`,

  'src/app/api/veo/export/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { putPrivateText, signedGetUrl } from "@/lib/veo-storage";
import { getUserId } from "@/lib/auth";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest){
  const userId = await getUserId(req); if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, json, instructionsText } = await req.json();
  if (!json) return NextResponse.json({ error: "Missing json" }, { status: 400 });
  const base = \`veo-prompts/\${userId}/\${id || Date.now()}\`;
  const jsonKey = \`\${base}/prompt.json\`; const txtKey  = instructionsText ? \`\${base}/instructions.txt\` : undefined;
  await putPrivateText(jsonKey, JSON.stringify(json, null, 2), "application/json");
  if (txtKey) await putPrivateText(txtKey, instructionsText, "text/plain");
  const jsonUrl = await signedGetUrl(jsonKey, 600); const txtUrl = txtKey ? await signedGetUrl(txtKey, 600) : null;
  return NextResponse.json({ jsonUrl, instructionsUrl: txtUrl });
}`,

  'src/app/api/veo/send/route.ts': `import { NextRequest, NextResponse } from "next/server"; import { getUserId } from "@/lib/auth"; import { prisma } from "@/lib/prisma";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
function joinUrl(base: string, path: string){ return \`\${base.replace(/\\/+$/, '')}/\${path.replace(/^\\+/, '')}\`; }
export async function POST(req: NextRequest){
  const userId = await getUserId(req);
  if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.VEO_API_URL) return NextResponse.json({ error: "Missing VEO_API_URL" }, { status: 500 });
  if (!process.env.VEO_API_KEY) return NextResponse.json({ error: "Missing VEO_API_KEY" }, { status: 500 });
  try {
    const { json, instructionsText, projectId, webhookUrl, promptId } = await req.json();
    if (!json) return NextResponse.json({ error: "Missing json" }, { status: 400 });
    const endpoint = joinUrl(process.env.VEO_API_URL, "v1/jobs"); // adjust to match provider docs
    const payload = { prompt: json, instructions_text: instructionsText, project_id: projectId, webhook_url: webhookUrl };
    const resp = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: \`Bearer \${process.env.VEO_API_KEY}\` }, body: JSON.stringify(payload) });
    const providerText = await resp.text(); let providerJson: any = null; try { providerJson = JSON.parse(providerText); } catch {}
    if (!resp.ok) {
      return NextResponse.json({ error: "Veo API failed", providerStatus: resp.status, providerEndpoint: endpoint, providerBody: providerJson || providerText }, { status: 502 });
    }
    const jobId = providerJson?.jobId || providerJson?.id || providerJson?.job?.id || "unknown";
    if (promptId) {
      const root = await prisma.veoPrompt.findUnique({ where: { id: promptId } });
      if (root && root.userId === userId) {
        const last = await prisma.veoPromptVersion.findFirst({ where: { promptId }, orderBy: { version: "desc" } });
        if (last) await prisma.veoPromptVersion.update({ where: { id: last.id }, data: { providerJobId: jobId, providerStatus: "submitted" } });
      }
    }
    return NextResponse.json({ jobId, providerEndpoint: endpoint, providerRaw: providerJson || providerText });
  } catch (e:any){ return NextResponse.json({ error: e?.message || "Send failure" }, { status: 500 }); }
}`,

  'src/app/api/veo/jobs/[id]/route.ts': `import { NextRequest, NextResponse } from "next/server"; import { getUserId } from "@/lib/auth";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
function joinUrl(base: string, path: string){ return \`\${base.replace(/\\/+$/, '')}/\${path.replace(/^\\+/, '')}\`; }
export async function GET(req: NextRequest, { params }: { params: { id: string }}){
  const userId = await getUserId(req); if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.VEO_API_URL) return NextResponse.json({ error: "Missing VEO_API_URL" }, { status: 500 });
  const endpoint = joinUrl(process.env.VEO_API_URL, \`v1/jobs/\${params.id}\`); // adjust path per provider
  const r = await fetch(endpoint, { headers: { Authorization: \`Bearer \${process.env.VEO_API_KEY}\` } });
  const text = await r.text(); let j:any=null; try { j = JSON.parse(text); } catch {}
  if (!r.ok) return NextResponse.json({ error: "Veo API failed", providerStatus: r.status, providerEndpoint: endpoint, providerBody: j || text }, { status: 502 });
  return NextResponse.json(j || text);
}`,

  'src/app/api/veo/webhooks/job/route.ts': `import { NextRequest, NextResponse } from "next/server"; import { prisma } from "@/lib/prisma";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
// TODO: verify webhook signature if provider supports it
export async function POST(req: NextRequest){
  const bodyText = await req.text(); let evt:any=null; try { evt = JSON.parse(bodyText); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const jobId = evt?.id || evt?.jobId || evt?.job?.id; const status = evt?.status; const assets = evt?.assets;
  if (!jobId) return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  // Try to find the latest version with this providerJobId
  const version = await prisma.veoPromptVersion.findFirst({ where: { providerJobId: jobId }, orderBy: { createdAt: "desc" } });
  if (version) {
    await prisma.veoPromptVersion.update({ where: { id: version.id }, data: { providerStatus: status || "unknown", assets: assets || version.assets } });
  }
  return NextResponse.json({ ok: true });
}`,

  'src/app/api/files/sign-upload/route.ts': `import { NextRequest, NextResponse } from "next/server"; import { getUserId } from "@/lib/auth"; import { signedPutUrl } from "@/lib/veo-storage";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest){
  const userId = await getUserId(req); if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { filename, contentType } = await req.json();
  if (!filename) return NextResponse.json({ error: "Missing filename" }, { status: 400 });
  const key = \`users/\${userId}/uploads/\${Date.now()}-\${filename}\`;
  const url = await signedPutUrl(key, contentType || "application/octet-stream", 600);
  return NextResponse.json({ url, key });
}`,

  'src/app/api/files/sign-download/route.ts': `import { NextRequest, NextResponse } from "next/server"; import { getUserId } from "@/lib/auth"; import { signedGetUrl } from "@/lib/veo-storage";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(req: NextRequest){
  const userId = await getUserId(req); if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url); const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
  const url = await signedGetUrl(key, 600); return NextResponse.json({ url });
}`,

  'src/app/api/images/generate/route.ts': `import { NextRequest, NextResponse } from "next/server"; import { getUserId } from "@/lib/auth";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest){
  const userId = await getUserId(req); if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Image provider not configured", imageUrls: [] }, { status: 501 });
}`,

  'src/app/api/media/tts/route.ts': `import { NextRequest, NextResponse } from "next/server"; import { getUserId } from "@/lib/auth";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest){
  const userId = await getUserId(req); if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "TTS provider not configured", audioUrl: null }, { status: 501 });
}`,

  'src/app/api/media/captions/route.ts': `import { NextRequest, NextResponse } from "next/server"; import { getUserId } from "@/lib/auth";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest){
  const userId = await getUserId(req); if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Captioning provider not configured", srtUrl: null, vttUrl: null }, { status: 501 });
}`
};

// Write all API route files
Object.entries(apiRoutes).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
  console.log(`📄 Created API route: ${filePath}`);
});

console.log('\n✅ API routes created!');
