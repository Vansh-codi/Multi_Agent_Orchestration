"use client";

import { useRef } from "react";
import { AgentEvent } from "./DashboardTabs";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Props {
  runId: string | null;
  setRunId: (id: string | null) => void;
  events: AgentEvent[];
  setEvents: (fn: (prev: AgentEvent[]) => AgentEvent[]) => void;
  status: "idle" | "running" | "done" | "error";
  setStatus: (s: "idle" | "running" | "done" | "error") => void;
  contextFiles?: string[];
}

// ✅ No AgentFeed import — terminal is handled by OutputTerminal in DashboardTabs
export default function GoalRunner({
  runId,
  setRunId,
  events,
  setEvents,
  status,
  setStatus,
  contextFiles,
}: Props) {
  const goalRef = useRef<HTMLTextAreaElement>(null);
  const runningRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const running = status === "running";

  function stop() {
    wsRef.current?.close();
    runningRef.current = false;
    setStatus("idle");
  }

  function reset() {
    stop();
    setRunId(null);
    setEvents(() => []);
    setStatus("idle");
    if (goalRef.current) goalRef.current.value = "";
  }

  async function handleRun() {
    const goal = goalRef.current?.value.trim();
    if (!goal || running) return;
    runningRef.current = true;
    setEvents(() => []);
    setRunId(null);
    setStatus("running");

    try {
      const res = await fetch(`${API}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ goal, context_files: contextFiles ?? [] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log("RUN RESPONSE:", data);
      if (data.github) {
        setEvents(() => [
          {
            node: "github",
            messages: [data.result],
          },
        ]);

        setStatus("done");
        runningRef.current = false;

        return;
      }

      const { run_id } = data;

      setRunId(run_id);

      const ws = new WebSocket(`ws://localhost:8000/ws/${run_id}`);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        const event = JSON.parse(e.data);

        console.log("WS EVENT:", event);

        if (event.type === "done") {
          setStatus("done");
          runningRef.current = false;
          ws.close();
          return;
        }

        if (event.error) {
          setStatus("error");
          runningRef.current = false;
          ws.close();
          return;
        }

        setEvents((prev) => [...prev, event]);
      };

      // ws.onmessage = (e) => {
      //   const event: AgentEvent = JSON.parse(e.data);
      //   console.log("WS EVENT:", event);
      //   setEvents((prev) => [...prev, event]);
      //   if (event.approved) {
      //     setStatus("done");
      //     runningRef.current = false;
      //     setTimeout(() => {
      //       ws.close();
      //     }, 500);
      //   }
      //   if (event.error) {
      //     setStatus("error");
      //     runningRef.current = false;
      //     ws.close();
      //   }
      // };
      ws.onerror = () => {
        setStatus("error");
        runningRef.current = false;
      };
    } catch (err) {
      console.error(err);
      setStatus("error");
      runningRef.current = false;
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="text-xl font-semibold mb-1">Run Multi-Agent Workflow</h2>
      <p className="text-sm text-zinc-500 mb-4">
        Describe your goal — agents will plan, research, code and review.
      </p>

      <textarea
        ref={goalRef}
        disabled={running}
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key === "Enter") handleRun();
        }}
        placeholder={`e.g. Write a Python function to add two numbers
          Slash commands:
  /git/ -> for git , add git free gain
  /planner  → only create a plan
  /researcher → only research
  /coder    → only write code  
  /critic   → only review
  /rag      → query uploaded files only`}
        className="w-full h-36 rounded-xl bg-zinc-950 border border-zinc-800
                   p-4 resize-none text-sm text-white placeholder:text-zinc-600
                   outline-none focus:border-green-500/40 transition-all disabled:opacity-50"
      />

      {contextFiles && contextFiles.length > 0 && (
        <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
          <span>📎</span>
          <span>
            {contextFiles.length} file{contextFiles.length > 1 ? "s" : ""} as
            context:
          </span>
          <span className="text-zinc-500 truncate">
            {contextFiles.join(", ")}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <button
          onClick={handleRun}
          disabled={running}
          className="px-5 py-2.5 rounded-xl bg-green-500 text-black font-bold text-sm
                     disabled:opacity-40 hover:bg-green-400 transition-colors flex items-center gap-2"
        >
          {running ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
              Running…
            </>
          ) : (
            "▶ Run Agents"
          )}
        </button>

        <button
          onClick={stop}
          disabled={!running}
          className="px-5 py-2.5 rounded-xl border border-zinc-700 text-sm font-medium
                     disabled:opacity-30 hover:border-red-500/40 hover:text-red-400 transition-colors"
        >
          ⏹ Stop
        </button>

        <button
          onClick={reset}
          disabled={running}
          className="px-5 py-2.5 rounded-xl border border-zinc-700 text-sm font-medium
                     disabled:opacity-30 hover:border-zinc-500 transition-colors"
        >
          ↺ Reset
        </button>

        <div className="ml-auto text-sm font-semibold">
          {status === "running" && (
            <span className="text-green-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Running
            </span>
          )}
          {status === "done" && (
            <span className="text-green-400">✓ Completed</span>
          )}
          {status === "error" && <span className="text-red-400">✗ Error</span>}
        </div>
      </div>

      {running && (
        <div className="mt-4 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-green-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
    // ✅ NO AgentFeed here — OutputTerminal is rendered by DashboardTabs below
  );
}
