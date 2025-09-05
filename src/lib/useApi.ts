import { useAuth } from "@/contexts/AuthContext";

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); }
  catch {
    throw new Error(`Non-JSON response (status ${res.status}): ${text.slice(0,400)}`);
  }
}

/**
 * Custom hook for making authenticated API calls with Supabase Auth
 * Automatically includes the user's access token in requests
 */
export function useApi() {
  const { token } = useAuth();

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {}),
    };
    
    const res = await fetch(url, { ...options, headers });
    const data = await safeJson(res);               // ✅ robust parsing
    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return { res, data };
  };

  return { apiCall };
}
