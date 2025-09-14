import { NextRequest, NextResponse } from "next/server";
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
}