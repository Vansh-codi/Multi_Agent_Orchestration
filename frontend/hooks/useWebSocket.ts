"use client";

import { useEffect, useState } from "react";

export function useWebSocket(url: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // ✅ Don't connect if url is null/empty — no run_id yet
    if (!url) return;

    const ws = new WebSocket(url);

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    ws.onclose = () => setConnected(false);

    ws.onerror = () => setConnected(false);

    return () => ws.close();
  }, [url]); // only re-runs when url changes

  return { messages, connected };
}
