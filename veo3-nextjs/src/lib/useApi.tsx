"use client";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
async function safeJson(res: Response) {
  const text = await res.text(); if (!text) return null;
  try { return JSON.parse(text); } catch { throw new Error(`Non-JSON response (status ${res.status}): ${text.slice(0,400)}`); }
}
export function useApi() {
  const supabase = useSupabaseClient();
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}), ...(options.headers || {}) };
    const res = await fetch(url, { ...options, headers });
    const data = await safeJson(res);
    if (!res.ok) { const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`; throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg)); }
    return { res, data };
  };
  return { apiCall };
}