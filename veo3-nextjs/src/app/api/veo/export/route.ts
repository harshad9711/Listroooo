import { NextRequest, NextResponse } from "next/server";
import { putPrivateText, signedGetUrl } from "@/lib/veo-storage";
import { getUserId } from "@/lib/auth";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest){
  const userId = await getUserId(req); if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, json, instructionsText } = await req.json();
  if (!json) return NextResponse.json({ error: "Missing json" }, { status: 400 });
  const base = `veo-prompts/${userId}/${id || Date.now()}`;
  const jsonKey = `${base}/prompt.json`; const txtKey  = instructionsText ? `${base}/instructions.txt` : undefined;
  await putPrivateText(jsonKey, JSON.stringify(json, null, 2), "application/json");
  if (txtKey) await putPrivateText(txtKey, instructionsText, "text/plain");
  const jsonUrl = await signedGetUrl(jsonKey, 600); const txtUrl = txtKey ? await signedGetUrl(txtKey, 600) : null;
  return NextResponse.json({ jsonUrl, instructionsUrl: txtUrl });
}