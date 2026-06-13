// frontend/app/lib/api.ts
// ──────────────────────────────────────────────────────────────
//  All backend URLs come from .env.local — never hardcoded.
//  Import { apiClient } from here instead of using fetch() directly.
// ──────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL!;

if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not set in .env.local");
if (!WS_URL) throw new Error("NEXT_PUBLIC_WS_URL is not set in .env.local");
export async function apiFetch(path: string, options?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
  });
}
export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function startRun(goal: string): Promise<string> {
  const res = await fetch(`${API_URL}/run`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    // IMPORTANT
    credentials: "include",

    body: JSON.stringify({
      goal,
    }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }

  const data = await res.json();

  return data.run_id as string;
}
export function createWebSocket(runId: string): WebSocket {
  return new WebSocket(`${WS_URL}/ws/${runId}`);
}
