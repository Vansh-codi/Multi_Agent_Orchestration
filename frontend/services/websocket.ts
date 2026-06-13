const WS = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function createWebSocket(run_id: string): WebSocket {
  return new WebSocket(`${WS}/ws/${run_id}`);
}
