import { createWebSocket } from "@/services/websocket";
import { useAgentStore } from "@/store/agentStore";

export function useAgentRun() {
  const addEvent = useAgentStore((s) => s.addEvent);
  const setStatus = useAgentStore((s) => s.setStatus);

  async function run(goal: string) {
     const API_URL =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

    const res = await fetch(`${API_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    });
    const { run_id } = await res.json();

    const ws = createWebSocket(run_id); // ← uses run_id correctly
    ws.onmessage = (e) => {
      const event = JSON.parse(e.data);
      addEvent(event);
      if (event.approved || event.error) {
        setStatus(event.error ? "error" : "done");
        ws.close();
      }
    };
  }

  return { run };
}
