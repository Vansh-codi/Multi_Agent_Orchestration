// frontend/app/api/assistant/ask/stream/route.ts
// Proxies SSE from Railway backend to Vercel frontend
// This is needed because Vercel can't run FastAPI directly

import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.text();

  // Forward cookies (JWT auth) to backend
  const cookie = req.headers.get("cookie") || "";

  const backendRes = await fetch(`${BACKEND_URL}/assistant/ask/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body,
  });

  if (!backendRes.ok) {
    return new Response(
      JSON.stringify({ error: `Backend error ${backendRes.status}` }),
      {
        status: backendRes.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Stream the SSE response through
  return new Response(backendRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
