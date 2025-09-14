import { NextRequest, NextResponse } from "next/server"; import { prisma } from "@/lib/prisma"; import { getUserId } from "@/lib/auth";
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
}