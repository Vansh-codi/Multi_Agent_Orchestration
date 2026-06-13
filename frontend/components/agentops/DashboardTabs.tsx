"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import AgentGraph from "./AgentGraph";
import FilesPanel from "./FilesPanel";
import GoalRunner from "./GoalRunner";
import LogsPanel from "./LogsPanel";
import OutputTerminal from "./OutputTerminal";
import UploadPanel from "./UploadPanel";
const TABS = ["Overview", "Live Feed", "Graph", "Files", "Logs", "Uploads"];

export interface AgentEvent {
  node: string;
  messages: string[];

  chunks?: {
    source: string;
    content: string;
    distance: number;
  }[];
  approved?: boolean;
  plan?: any[];
  error?: string;
  event?: string;
  agent?: string;
  similarity?: number;
  distance?: number;
  threshold?: number;
  sources?: string[];
}

const COLORS: Record<string, string> = {
  supervisor: "text-violet-400",
  planner: "text-emerald-400",
  researcher: "text-sky-400",
  coder: "text-amber-400",
  critic: "text-pink-400",
  system: "text-red-400",
  github: "text-orange-400",
};
const ICONS: Record<string, string> = {
  supervisor: "🧠",
  planner: "📋",
  researcher: "🔍",
  coder: "💻",
  critic: "🎯",
  system: "⚠️",
};

export default function DashboardTabs() {
  const [active, setActive] = useState("Overview");
  const [runId, setRunId] = useState<string | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(
    "idle",
  );
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [contextFiles, setContextFiles] = useState<string[]>([]);

  useEffect(() => {
    loadUploadedFiles();
  }, []);
  useEffect(() => {
    const saved = localStorage.getItem("contextFiles");

    if (saved) {
      try {
        setContextFiles(JSON.parse(saved));
      } catch {
        localStorage.removeItem("contextFiles");
      }
    }
  }, []);

  useEffect(() => {
    console.log("UPLOADED FILES CHANGED:", uploadedFiles);
  }, [uploadedFiles]);

  useEffect(() => {
    console.log("CONTEXT FILES CHANGED:", contextFiles);

    localStorage.setItem("contextFiles", JSON.stringify(contextFiles));
  }, [contextFiles]);

  const loadUploadedFiles = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/uploaded-files`,
        {
          credentials: "include",
        },
      );

      const data = await res.json();

      console.log("UPLOADED FILES:", data.files);

      setUploadedFiles(data.files ?? []);

      // DO NOT AUTO-SELECT FILES
      // setContextFiles(data.files ?? []);
    } catch (err) {
      console.error("Failed loading uploaded files", err);
    }
  };
  return (
    <div className="space-y-6">
      <div className="relative flex border-b border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-5 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-[1px]
              ${
                active === tab
                  ? "border-green-500 text-green-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
          >
            {tab}
          </button>
        ))}{" "}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          <div>
            {/* ── OVERVIEW: goal input + VS Code terminal ── */}
            {active === "Overview" && (
              <div className="space-y-4">
                <GoalRunner
                  runId={runId}
                  setRunId={setRunId}
                  events={events}
                  setEvents={setEvents}
                  status={status}
                  setStatus={setStatus}
                  contextFiles={contextFiles}
                />
                {/* VS Code terminal — always visible, populates as agents run */}
                <OutputTerminal events={events} status={status} />
              </div>
            )}

            {/* ── LIVE FEED: all agent events ── */}
            {active === "Live Feed" && (
              <div className="space-y-4">
                <div
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-3
                            flex items-center justify-between flex-wrap gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold">Live Agent Feed</p>
                    <p className="text-xs text-zinc-500">
                      Start a run from{" "}
                      <button
                        onClick={() => setActive("Overview")}
                        className="text-green-400 underline underline-offset-2"
                      >
                        Overview
                      </button>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {status === "running" && (
                      <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Running
                      </span>
                    )}
                    {status === "done" && (
                      <span className="text-xs text-green-400 font-semibold">
                        ✓ Completed
                      </span>
                    )}
                    {status === "error" && (
                      <span className="text-xs text-red-400 font-semibold">
                        ✗ Error
                      </span>
                    )}
                    {status === "idle" && (
                      <span className="text-xs text-zinc-600">
                        No active run
                      </span>
                    )}
                    <span className="text-xs text-zinc-600 font-mono">
                      {events.length} events
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black p-6">
                  {events.length === 0 ? (
                    <p className="text-zinc-600 text-sm text-center py-16">
                      No events yet —{" "}
                      <button
                        onClick={() => setActive("Overview")}
                        className="text-green-400 underline underline-offset-2"
                      >
                        run a goal from Overview
                      </button>
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {events.map((evt, i) => {
                        const node = evt.node ?? evt.agent ?? "system";
                        const color = COLORS[node] ?? "text-zinc-400";
                        const icon = ICONS[node] ?? "•";
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
                                <span
                                  className={`text-xs font-bold uppercase ${color}`}
                                >
                                  {node}
                                </span>
                                {evt.approved && (
                                  <span className="text-xs text-green-400 font-semibold">
                                    ✓ Approved
                                  </span>
                                )}
                                {evt.error && (
                                  <span className="text-xs text-red-400">
                                    Error
                                  </span>
                                )}
                              </div>
                              {(evt.event ?? evt.messages?.[0]) && (
                                <p className="text-zinc-300 text-sm leading-relaxed">
                                  {evt.event ?? evt.messages?.[0]}
                                </p>
                              )}
                              {evt.plan && (
                                <div className="mt-3 space-y-2">
                                  {evt.plan.map((task: any) => (
                                    <div
                                      key={task.id}
                                      className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
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
                                          Depends on:{" "}
                                          {task.depends_on.join(", ")}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {evt.error && (
                                <p className="text-red-400 text-xs mt-1">
                                  {evt.error}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {active === "Graph" && <AgentGraph events={events} />}
            {active === "Files" && <FilesPanel />}
            {active === "Logs" && <LogsPanel events={events} />}
            {active === "Uploads" && (
              <UploadPanel
                uploadedFiles={uploadedFiles}
                contextFiles={contextFiles}
                setContextFiles={setContextFiles}
                onRunWithFiles={() => setActive("Overview")}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
