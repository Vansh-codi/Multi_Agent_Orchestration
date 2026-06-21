"use client";

// frontend/app/orion/page.tsx
// Web version of Orion — works on Vercel deploy (no Electron needed)
// Screenshot mode becomes "paste" mode in web context
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "paste" | "screen";

interface Message {
  id: string;
  role: "user" | "orion";
  content: string;
  provider?: string;
  timestamp: Date;
}

// ── Markdown renderer (lightweight) ──────────────────────────────────────────

function renderContent(text: string) {
  const parts = text.split(/(```[\w]*\n[\s\S]*?```)/g);
  return parts.map((part, i) => {
    const codeMatch = part.match(/```([\w]*)\n([\s\S]*?)```/);
    if (codeMatch) {
      return (
        <pre
          key={i}
          className="bg-black/60 border border-[#1d9e75]/20 rounded-lg p-4 my-3 overflow-x-auto"
        >
          {codeMatch[1] && (
            <span className="text-[#1d9e75]/50 text-xs font-mono block mb-2">
              {codeMatch[1]}
            </span>
          )}
          <code className="text-[#5dcaa5] text-xs font-mono leading-relaxed">
            {codeMatch[2]}
          </code>
        </pre>
      );
    }
    // Inline code
    const inlineParts = part.split(/(`[^`]+`)/g);
    return (
      <span key={i}>
        {inlineParts.map((p, j) => {
          if (p.startsWith("`") && p.endsWith("`")) {
            return (
              <code
                key={j}
                className="bg-black/50 border border-[#1d9e75]/20 text-[#5dcaa5] px-1.5 py-0.5 rounded text-xs font-mono"
              >
                {p.slice(1, -1)}
              </code>
            );
          }
          return (
            <span key={j} className="whitespace-pre-wrap">
              {p}
            </span>
          );
        })}
      </span>
    );
  });
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OrionPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("paste");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [screenshotB64, setScreenshotB64] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null,
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // ── Screenshot upload (web: user uploads file) ───────────────────────────
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const b64 = result.split(",")[1];
      setScreenshotB64(b64);
      setScreenshotPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const clearScreenshot = () => {
    setScreenshotB64(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const send = useCallback(async () => {
    const question = input.trim();
    if (!question && !screenshotB64) return;
    if (loading) return;

    setLoading(true);
    setInput("");

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question || "(screenshot provided)",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const orionId = crypto.randomUUID();
    const orionMsg: Message = {
      id: orionId,
      role: "orion",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, orionMsg]);

    try {
      const body: Record<string, unknown> = { question };

      if (screenshotB64 && mode === "screen") {
        body.screenshot = screenshotB64;
      } else if (question) {
        body.pasted_text = question;
      }
      console.log("ORION SEND");
      console.log("QUESTION:", question);

      const res = await fetch("/api/assistant/ask/stream", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      console.log("STATUS:", res.status);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.status) setStatus(data.status);
            if (data.token) {
              fullText += data.token;
              setStatus("");
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === orionId ? { ...m, content: fullText } : m,
                ),
              );
            }
            if (data.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === orionId ? { ...m, provider: data.provider } : m,
                ),
              );
              clearScreenshot();
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === orionId
            ? { ...m, content: "Connection error — is the backend running?" }
            : m,
        ),
      );
    } finally {
      setLoading(false);
      setStatus("");
    }
  }, [input, screenshotB64, mode, loading]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[#1d9e75] text-xl font-black font-mono tracking-tighter">
            ⬡ Orion
          </span>
          <span className="text-[10px] font-mono text-[#1d4030] bg-[#0f2d24] px-2 py-0.5 rounded-full border border-[#1d9e75]/20">
            AgentOps Assistant
          </span>
          <Link
            href="/orion/download"
            className="text-[10px] font-mono px-2 py-1 rounded-md
             border border-[#1d9e75]/30
             text-[#1d9e75]
             hover:bg-[#0f2d24]
             transition"
          >
            Download Desktop
          </Link>
        </div>
        {/* Privacy badge */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#0f6e56]">
          <span>🔒</span>
          <span>screenshot → local ollama → text only → cloud</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-20 space-y-3"
          >
            <p className="text-[#1d9e75] text-4xl">⬡</p>
            <p className="text-slate-400 text-sm">
              Ask anything — paste your code, problem, or error
            </p>
            <p className="text-slate-600 text-xs font-mono">
              Or upload a screenshot — extracted locally, only text sent to
              cloud
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#0f2d24] border border-[#1d9e75]/30 text-slate-200 rounded-br-sm"
                    : "bg-[#111] border border-[#1a1a1a] text-slate-300 rounded-bl-sm"
                }`}
              >
                {msg.role === "orion" && (
                  <span className="text-[#1d9e75] font-mono text-[10px] font-bold block mb-2 tracking-wider">
                    ORION
                    {msg.provider && msg.provider !== "groq" && (
                      <span className="text-[#0f6e56] ml-2">
                        via {msg.provider}
                      </span>
                    )}
                  </span>
                )}
                {msg.content ? (
                  renderContent(msg.content)
                ) : (
                  <span className="text-slate-600 italic text-xs">
                    thinking...
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming status */}
        {status && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex items-center gap-2 text-[#1d9e75] text-xs font-mono bg-[#0f2d24]/50 px-3 py-2 rounded-xl border border-[#1d9e75]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d9e75] animate-pulse" />
              {status}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Screenshot preview */}
      <AnimatePresence>
        {screenshotPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[#1a1a1a] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <img
                src={screenshotPreview}
                alt="Screenshot"
                className="h-14 w-auto rounded border border-[#1d9e75]/20 object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-[#1d9e75]">
                  Screenshot ready
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Will be processed locally by Ollama — only extracted text goes
                  to cloud
                </p>
              </div>
              <button
                onClick={clearScreenshot}
                className="text-slate-600 hover:text-slate-400 text-xs font-mono px-2 py-1 rounded border border-[#1a1a1a] hover:border-[#333] transition-colors"
              >
                ✕ remove
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="border-t border-[#1a1a1a] px-4 py-4 flex-shrink-0">
        {/* Mode tabs */}
        <div className="flex gap-2 mb-3">
          {(["paste", "screen"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-[10px] font-mono px-3 py-1 rounded-md border transition-colors ${
                mode === m
                  ? "border-[#1d9e75] text-[#1d9e75] bg-[#0f2d24]"
                  : "border-[#1a1a1a] text-slate-600 hover:border-[#333] hover:text-slate-500"
              }`}
            >
              {m === "paste" ? "📋 paste / type" : "📷 upload screenshot"}
            </button>
          ))}
        </div>

        {/* Screenshot upload button (screen mode) */}
        {mode === "screen" && !screenshotB64 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleScreenshotUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border border-dashed border-[#1d9e75]/30 rounded-xl py-3 text-xs font-mono text-slate-600 hover:text-[#1d9e75] hover:border-[#1d9e75]/50 transition-colors"
            >
              click to upload screenshot (processed locally)
            </button>
          </motion.div>
        )}

        {/* Text input */}
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              mode === "screen" && screenshotB64
                ? "Ask about the screenshot... (Enter to send)"
                : "Paste code, error, or problem here... (Enter to send, Shift+Enter for newline)"
            }
            rows={3}
            className="flex-1 bg-[#111] border border-[#1a1a1a] focus:border-[#1d9e75]/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-700 outline-none resize-none font-mono leading-relaxed transition-colors"
          />
          <button
            onClick={send}
            disabled={loading || (!input.trim() && !screenshotB64)}
            className="bg-[#0f6e56] hover:bg-[#1d9e75] disabled:opacity-30 disabled:cursor-not-allowed border border-[#1d9e75] rounded-xl px-5 py-3 text-sm font-bold text-[#e1f5ee] hover:text-black transition-all self-stretch"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                ...
              </span>
            ) : (
              "Ask"
            )}
          </button>
        </div>

        <p className="text-[10px] font-mono text-[#1d4030] mt-2">
          🔒 screenshots processed locally · only text reaches cloud · memory
          stored in your DB
        </p>
      </div>
    </div>
  );
}
