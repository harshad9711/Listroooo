import { NextRequest, NextResponse } from "next/server"; import { getUserId } from "@/lib/auth"; import { prisma } from "@/lib/prisma";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
function joinUrl(base: string, path: string){ return `${base.replace(/\/+$/, '')}/${path.replace(/^\+/, '')}`; }
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
    const resp = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.VEO_API_KEY}` }, body: JSON.stringify(payload) });
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
}