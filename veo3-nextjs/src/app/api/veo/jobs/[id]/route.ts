import { NextRequest, NextResponse } from "next/server"; import { getUserId } from "@/lib/auth";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
function joinUrl(base: string, path: string){ return `${base.replace(/\/+$/, '')}/${path.replace(/^\+/, '')}`; }
export async function GET(req: NextRequest, { params }: { params: { id: string }}){
  const userId = await getUserId(req); if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.VEO_API_URL) return NextResponse.json({ error: "Missing VEO_API_URL" }, { status: 500 });
  const endpoint = joinUrl(process.env.VEO_API_URL, `v1/jobs/${params.id}`); // adjust path per provider
  const r = await fetch(endpoint, { headers: { Authorization: `Bearer ${process.env.VEO_API_KEY}` } });
  const text = await r.text(); let j:any=null; try { j = JSON.parse(text); } catch {}
  if (!r.ok) return NextResponse.json({ error: "Veo API failed", providerStatus: r.status, providerEndpoint: endpoint, providerBody: j || text }, { status: 502 });
  return NextResponse.json(j || text);
}