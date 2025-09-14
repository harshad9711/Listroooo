import { NextRequest, NextResponse } from "next/server"; import { prisma } from "@/lib/prisma";
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
}