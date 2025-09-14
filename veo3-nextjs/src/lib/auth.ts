import type { NextRequest } from "next/server";
import { getSupabaseUserIdFromCookies, getSupabaseUserIdFromBearer } from "./auth-supabase";
export async function getUserId(req?: NextRequest): Promise<string> {
  try { const uid = await getSupabaseUserIdFromCookies(); if (uid) return uid; } catch {}
  if (req) { const uid = await getSupabaseUserIdFromBearer(req); if (uid) return uid; }
  return "demo-user";
}