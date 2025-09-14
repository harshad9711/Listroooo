import { NextRequest, NextResponse } from "next/server"; import { getUserId } from "@/lib/auth"; import { signedGetUrl } from "@/lib/veo-storage";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(req: NextRequest){
  const userId = await getUserId(req); if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url); const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
  const url = await signedGetUrl(key, 600); return NextResponse.json({ url });
}