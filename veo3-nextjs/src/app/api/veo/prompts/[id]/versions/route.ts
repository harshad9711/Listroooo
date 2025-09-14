import { NextRequest, NextResponse } from "next/server"; import { prisma } from "@/lib/prisma"; import { getUserId } from "@/lib/auth";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(req: NextRequest, { params }: { params: { id: string }}) {
  const userId = await getUserId(req);
  const root = await prisma.veoPrompt.findUnique({ where: { id: params.id } });
  if (!root || root.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const versions = await prisma.veoPromptVersion.findMany({ where: { promptId: params.id }, orderBy: { version: "desc" } });
  return NextResponse.json(versions);
}