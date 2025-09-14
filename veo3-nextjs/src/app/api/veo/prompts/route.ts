import { NextRequest, NextResponse } from "next/server";
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
}