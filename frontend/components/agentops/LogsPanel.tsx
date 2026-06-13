"use client";

import { useState } from "react";
import { AgentEvent } from "./DashboardTabs";

const COLORS: Record<string, string> = {
  supervisor: "text-violet-400",
  planner: "text-emerald-400",
  researcher: "text-sky-400",
  coder: "text-amber-400",
  critic: "text-pink-400",
  system: "text-red-400",
  github: "text-orange-400",
};

interface Props {
  events: AgentEvent[];
}

export default function LogsPanel({ events }: Props) {
  const [filter, setFilter] = useState("all");
  const agents = [
    "all",
    "supervisor",
    "planner",
    "researcher",
    "coder",
    "critic",
    "system",
    "github",
  ];

  const filtered =
    filter === "all" ? events : events.filter((e) => e.node === filter);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Execution Logs</h2>
        <span className="text-xs text-zinc-600 font-mono">
          {events.length} entries
        </span>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {agents.map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all
              ${
                filter === a
                  ? "bg-green-500/10 text-green-400 border border-green-500/30"
                  : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-600"
              }`}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Log entries */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto font-mono">
        {filtered.length === 0 && (
          <p className="text-zinc-600 text-sm text-center py-12">
            {events.length === 0
              ? "No logs yet — run a goal from Overview."
              : "No entries for this filter."}
          </p>
        )}
        {filtered.map((evt, i) => (
          <div
            key={i}
            className="rounded-lg bg-zinc-950 border border-zinc-800/50 p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[11px] font-bold uppercase ${COLORS[evt.node] ?? "text-zinc-400"}`}
              >
                [{evt.node}]
              </span>
              {evt.approved && (
                <span className="text-[10px] text-green-400">✓ approved</span>
              )}
              {evt.error && (
                <span className="text-[10px] text-red-400">✗ error</span>
              )}
            </div>
            {evt.messages?.map((m, j) => (
              <p key={j} className="text-xs text-zinc-400 leading-relaxed">
                {m}
              </p>
            ))}
            {evt.error && (
              <p className="text-xs text-red-400 mt-1">{evt.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
