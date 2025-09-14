import { NextRequest, NextResponse } from "next/server"; import { getUserId } from "@/lib/auth"; import { signedPutUrl } from "@/lib/veo-storage";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest){
  const userId = await getUserId(req); if (userId === "demo-user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { filename, contentType } = await req.json();
  if (!filename) return NextResponse.json({ error: "Missing filename" }, { status: 400 });
  const key = `users/${userId}/uploads/${Date.now()}-${filename}`;
  const url = await signedPutUrl(key, contentType || "application/octet-stream", 600);
  return NextResponse.json({ url, key });
}