"use client";

import { useEffect, useRef, useState } from "react";
import { AgentEvent } from "./DashboardTabs";

interface Props {
  events: AgentEvent[];
  status: "idle" | "running" | "done" | "error";
}

function parseCoderOutput(msg: string) {
  const taskMatch = msg.match(/TASK:\s*(.+?)(?=SAVED AS:|GENERATED CODE:|$)/);
  const savedMatch = msg.match(/SAVED AS:\s*(\S+)/);
  const codeMatch = msg.match(
    /GENERATED CODE:\s*([\s\S]+?)(?=EXECUTION RESULT:|$)/,
  );
  const resultMatch = msg.match(/EXECUTION RESULT:\s*([\s\S]+)/);
  return {
    task: taskMatch?.[1]?.trim() ?? "",
    saved: savedMatch?.[1]?.trim() ?? "",
    code: codeMatch?.[1]?.trim() ?? "",
    result: resultMatch?.[1]?.trim() ?? "",
  };
}

// Colorize code lines without dangerouslySetInnerHTML
function CodeLine({ line }: { line: string }) {
  const isComment = line.trim().startsWith("#");
  const isKeyword =
    /^\s*(def|return|if|else|elif|for|while|import|from|class|pass|break|continue|try|except|with|as|yield|lambda)\b/.test(
      line,
    );
  const isString = /^\s*["']/.test(line.trim());

  const color = isComment ? "#546e7a" : isKeyword ? "#c792ea" : "#e2e8f0";

  // Split line into tokens for coloring
  const parts: JSX.Element[] = [];
  let remaining = line;
  let idx = 0;

  // Simple token pass
  const tokens = line.split(
    /(\b(?:def|return|if|else|elif|for|while|import|from|class|in|not|and|or|True|False|None|print|try|except|with|as|pass|break|continue)\b|"[^"]*"|'[^']*'|\d+\.?\d*|#.*$)/g,
  );

  return (
    <span>
      {tokens.map((token, i) => {
        if (
          /^(def|return|if|else|elif|for|while|import|from|class|in|not|and|or|True|False|None|try|except|with|as|pass|break|continue)$/.test(
            token,
          )
        ) {
          return (
            <span key={i} style={{ color: "#c792ea" }}>
              {token}
            </span>
          );
        }
        if (/^(True|False|None)$/.test(token)) {
          return (
            <span key={i} style={{ color: "#ff9cac" }}>
              {token}
            </span>
          );
        }
        if (/^["'].*["']$/.test(token)) {
          return (
            <span key={i} style={{ color: "#c3e88d" }}>
              {token}
            </span>
          );
        }
        if (/^\d+\.?\d*$/.test(token)) {
          return (
            <span key={i} style={{ color: "#f78c6c" }}>
              {token}
            </span>
          );
        }
        if (token.startsWith("#")) {
          return (
            <span key={i} style={{ color: "#546e7a", fontStyle: "italic" }}>
              {token}
            </span>
          );
        }
        if (/^print$/.test(token)) {
          return (
            <span key={i} style={{ color: "#82aaff" }}>
              {token}
            </span>
          );
        }
        return (
          <span key={i} style={{ color: "#e2e8f0" }}>
            {token}
          </span>
        );
      })}
    </span>
  );
}
function getRunCommand(filename: string) {
  if (!filename) return "";

  if (filename.endsWith(".py")) return `python ${filename}`;

  if (filename.endsWith(".cpp")) return `g++ ${filename} -o app && ./app`;

  if (filename.endsWith(".c")) return `gcc ${filename} -o app && ./app`;

  if (filename.endsWith(".js")) return `node ${filename}`;

  if (filename.endsWith(".ts")) return `npx ts-node ${filename}`;

  if (filename.endsWith(".go")) return `go run ${filename}`;

  if (filename.endsWith(".java")) return `javac ${filename} && java Main`;

  return `executing ${filename}`;
}
export default function OutputTerminal({ events, status }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"terminal" | "files">("terminal");
  const startTime = useRef(new Date().toLocaleTimeString());

  const coderEvents = events.filter((e) => e.node === "coder");
  const savedFiles = coderEvents
    .map((e) => parseCoderOutput(e.messages?.[0] ?? "").saved)
    .filter(Boolean);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const nodeColors: Record<string, string> = {
    supervisor: "#a78bfa",
    planner: "#34d399",
    researcher: "#38bdf8",
    critic: "#f472b6",
    system: "#f87171",
    github: "#f97316",
  };

  return (
    <div
      className="rounded-xl overflow-hidden border border-zinc-700/50"
      style={{
        fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
      }}
    >
      {/* ── Title bar ── */}
      <div className="flex items-center bg-[#1e1e1e] border-b border-zinc-700/50 select-none">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 border-r border-zinc-700/50">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>

        <button
          onClick={() => setTab("terminal")}
          className={`px-4 py-2.5 text-[11px] font-medium border-r border-zinc-700/50 transition-colors
              ${tab === "terminal" ? "bg-[#252526] text-white" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          TERMINAL
        </button>
        <button
          onClick={() => setTab("files")}
          className={`px-4 py-2.5 text-[11px] font-medium border-r border-zinc-700/50 transition-colors
              ${tab === "files" ? "bg-[#252526] text-white" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          OUTPUT{savedFiles.length > 0 ? ` (${savedFiles.length})` : ""}
        </button>

        <div className="ml-auto px-4 flex items-center gap-3 text-[10px]">
          {status === "running" && (
            <span className="flex items-center gap-1 text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              RUNNING
            </span>
          )}
          {status === "done" && <span className="text-green-400">✓ DONE</span>}
          {status === "error" && <span className="text-red-400">✗ ERROR</span>}
          {status === "idle" && <span className="text-zinc-600">READY</span>}
          <span className="text-zinc-600">bash</span>
        </div>
      </div>

      {/* ── TERMINAL tab ── */}
      {tab === "terminal" && (
        <div className="bg-[#0d0d0d] p-4 min-h-[360px] max-h-[540px] overflow-y-auto text-xs">
          <p className="text-zinc-600 mb-1" suppressHydrationWarning>
            Last login: {startTime.current}
          </p>
          <p className="text-zinc-600 mb-4">agentops ~ %</p>

          {events.length === 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-green-500">agentops</span>
              <span className="text-zinc-600">~</span>
              <span className="text-white">$</span>
              <span className="text-zinc-500 animate-pulse">
                awaiting goal...
              </span>
            </div>
          ) : (
            <div>
              {events
                .filter((evt) => {
                  // Skip blank system events
                  if (evt.node === "system" && !evt.error && !evt.messages?.[0])
                    return false;
                  return true;
                })
                .map((evt, i) => {
                  const node = evt.node ?? "system";
                  const rawMsg = evt.messages?.[0];
                  const msg = evt.messages?.[0] ?? evt.error ?? "";

                  // ── Coder: render nicely ──
                  if (node === "planner" && msg) {
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2 leading-5 mb-0.5"
                      >
                        <span className="text-zinc-700 select-none flex-shrink-0 w-7 text-right">
                          {i + 1}
                        </span>
                        <span
                          style={{ color: "#34d399" }}
                          className="flex-shrink-0 w-20 font-semibold"
                        >
                          [planner]
                        </span>
                        <span className="text-zinc-400 flex-1">{msg}</span>
                        {evt.approved && (
                          <span className="text-green-400">✓</span>
                        )}
                      </div>
                    );
                  }
                  if (node === "researcher" && msg) {
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2 leading-5 mb-4"
                      >
                        <span className="text-zinc-700 select-none flex-shrink-0 w-7 text-right">
                          {i + 1}
                        </span>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              style={{ color: "#38bdf8" }}
                              className="font-semibold"
                            >
                              [researcher]
                            </span>

                            {evt.approved && (
                              <span className="text-green-400">✓</span>
                            )}
                          </div>

                          {evt.sources && (
                            <div className="mb-3 rounded border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs font-mono">
                              <div className="text-cyan-400 mb-1">
                                Retrieved Context
                              </div>

                              <div className="text-zinc-400">
                                Source : {evt.sources.join(", ")}
                              </div>

                              <div className="text-zinc-400">
                                Confidence : {evt.similarity}%
                              </div>

                              <div className="text-zinc-400">
                                Threshold : {evt.threshold}
                              </div>
                            </div>
                          )}

                          <div className="text-zinc-300 whitespace-pre-wrap">
                            {msg}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (node === "coder" && msg) {
                    const parsed = parseCoderOutput(msg);
                    const lines = parsed.code ? parsed.code.split("\n") : [];

                    return (
                      <div key={i} className="mt-4 mb-3">
                        {/* Command */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-green-500">agentops</span>
                          <span className="text-zinc-600">~</span>
                          <span className="text-white">$</span>
                          <span className="text-amber-300">
                            coder --task &quot;{parsed.task || "generate code"}
                            &quot;
                          </span>
                        </div>

                        {/* Saved file */}
                        {parsed.saved && (
                          <p className="text-blue-400 mb-2 pl-4">
                            → writing{" "}
                            <span className="text-blue-300 font-semibold">
                              {parsed.saved}
                            </span>
                          </p>
                        )}

                        {/* Code block */}
                        {lines.length > 0 && (
                          <div className="rounded-lg border border-zinc-700/50 overflow-hidden mb-2">
                            {/* File tab */}
                            <div className="flex items-center px-3 py-1.5 bg-[#252526] border-b border-zinc-700/40">
                              <span className="text-[10px] text-zinc-400">
                                {parsed.saved || "output.py"}
                              </span>
                              <div className="ml-auto flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-zinc-600" />
                                <div className="w-2 h-2 rounded-full bg-zinc-600" />
                                <div className="w-2 h-2 rounded-full bg-zinc-600" />
                              </div>
                            </div>
                            {/* Lines with line numbers */}
                            <div className="flex bg-[#1a1a1a]">
                              {/* Gutter */}
                              <div
                                className="flex flex-col px-3 py-3 border-r border-zinc-700/30
                                              text-right select-none flex-shrink-0"
                              >
                                {lines.map((_, li) => (
                                  <span
                                    key={li}
                                    className="text-zinc-600 leading-5"
                                  >
                                    {li + 1}
                                  </span>
                                ))}
                              </div>
                              {/* Code */}
                              <pre className="flex-1 px-4 py-3 leading-5 overflow-x-auto whitespace-pre">
                                {lines.map((line, li) => (
                                  <div key={li}>
                                    <CodeLine line={line} />
                                  </div>
                                ))}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Execution result */}
                        {parsed.result && (
                          <div className="pl-4 mt-1">
                            <p className="text-zinc-500">
                              $ {getRunCommand(parsed.saved)}
                            </p>
                            <p className="text-green-400 mt-0.5">
                              {parsed.result}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // ── Other agents ──
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-2 leading-5 mb-0.5"
                    >
                      <span className="text-zinc-700 select-none flex-shrink-0 w-7 text-right">
                        {i + 1}
                      </span>
                      <span
                        style={{ color: nodeColors[node] ?? "#6b7280" }}
                        className="flex-shrink-0 w-20 font-semibold"
                      >
                        [{node}]
                      </span>
                      <span className="text-zinc-400 flex-1 break-words">
                        {/* Truncate long researcher summaries */}
                        {msg.length > 200 ? msg.slice(0, 200) + "..." : msg}
                      </span>
                      {evt.approved && (
                        <span className="text-green-400">✓</span>
                      )}
                    </div>
                  );
                })}

              {/* Done cursor */}
              {status === "done" && (
                <div className="mt-4 pt-2 border-t border-zinc-800">
                  <p className="text-green-400">Process exited with code 0</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-green-500">agentops</span>
                    <span className="text-zinc-600">~</span>
                    <span className="text-white">$</span>
                    <span className="w-2 h-4 bg-white/70 animate-pulse inline-block" />
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── FILES tab ── */}
      {tab === "files" && (
        <div className="bg-[#0d0d0d] p-4 min-h-[360px] text-xs">
          {savedFiles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-600">No output files yet</p>
              <p className="text-zinc-700 mt-1">Run a goal to generate files</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-zinc-600 mb-4">$ ls -la generated_code/</p>
              {savedFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-800
                              bg-[#1a1a1a] hover:border-zinc-600 transition-colors group"
                >
                  <span className="text-green-500 select-none">-rw-r--r--</span>
                  <span className="text-zinc-300 flex-1 font-mono truncate">
                    {file}
                  </span>
                  <button
                    onClick={() => {
                      window.open(
                        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/generated-files/${file}`,
                        "_blank",
                      );
                    }}
                    className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity
              px-2 py-1 rounded border border-green-500/30 hover:bg-green-500/10"
                  >
                    ↓ download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
