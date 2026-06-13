"use client";

import { useEffect, useRef } from "react";
import { AgentEvent } from "./DashboardTabs";

const COLORS: Record<string, string> = {
  supervisor: "text-violet-400",
  planner: "text-emerald-400",
  researcher: "text-sky-400",
  coder: "text-amber-400",
  critic: "text-pink-400",
  system: "text-red-400",
};
const ICONS: Record<string, string> = {
  supervisor: "🧠",
  planner: "📋",
  researcher: "🔍",
  coder: "💻",
  critic: "🎯",
  system: "⚠️",
};

interface Props {
  runId: string | null;
  events: AgentEvent[];
}

export default function AgentFeed({ runId, events }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Live Agent Feed</h3>
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold
          ${runId ? "text-green-400" : "text-zinc-600"}`}
        >
          <span
            className={`w-2 h-2 rounded-full
            ${runId ? "bg-green-400 animate-pulse" : "bg-zinc-700"}`}
          />
          {runId ? "LIVE" : "WAITING"}
        </span>
      </div>

      {events.length === 0 && (
        <p className="text-zinc-600 text-sm text-center py-12">
          {runId
            ? "Waiting for agent events…"
            : "Run a goal above to see the live feed"}
        </p>
      )}

      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {events.map((evt, i) => {
          const node = evt.node ?? evt.agent ?? "system";
          const color = COLORS[node] ?? "text-zinc-400";
          const icon = ICONS[node] ?? "•";
          const text = evt.event ?? evt.messages?.[0] ?? "";
          return (
            <div
              key={i}
              className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
            >
              <div
                className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700
                              flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase ${color}`}>
                    {node}
                  </span>
                  {evt.approved && (
                    <span className="text-xs text-green-400 font-semibold">
                      ✓ Approved
                    </span>
                  )}
                  {evt.error && (
                    <span className="text-xs text-red-400">Error</span>
                  )}
                </div>
                {text && (
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    {text}
                  </p>
                )}
                {evt.plan && (
                  <div className="mt-3 space-y-2">
                    {evt.plan.map((task: any) => (
                      <div
                        key={task.id}
                        className="
          rounded-lg
          border
          border-zinc-800
          bg-zinc-900
          p-3
        "
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-300">
                            {task.id}
                          </span>

                          <span className="text-[10px] uppercase text-zinc-500">
                            {task.assigned_to}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-zinc-400">
                          {task.task}
                        </p>

                        {task.depends_on?.length > 0 && (
                          <p className="mt-2 text-[10px] text-zinc-600">
                            Depends on: {task.depends_on.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {evt.error && (
                  <p className="text-red-400 text-xs mt-1">{evt.error}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
