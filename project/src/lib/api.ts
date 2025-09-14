export async function apiCall(path: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  } as Record<string, string>;
  
  const res = await fetch(path, { ...options, headers });
  const text = await res.text();
  const data = text ? (() => { 
    try { 
      return JSON.parse(text); 
    } catch { 
      throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 300)}`); 
    } 
  })() : null;
  
  if (!res.ok) throw new Error((data && (data.error || data.message)) || `HTTP ${res.status}`);
  return data;
}