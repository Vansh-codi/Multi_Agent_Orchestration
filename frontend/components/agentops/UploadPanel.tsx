"use client";

import { useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface UploadedFile {
  name: string;
  size: number;
  status: "uploading" | "done" | "error";
  selected: boolean;
}

interface Props {
  uploadedFiles: string[];
  contextFiles: string[];
  setContextFiles: (files: string[]) => void;
  onRunWithFiles: () => void;
}

export default function UploadPanel({
  uploadedFiles,
  contextFiles,
  setContextFiles,
  onRunWithFiles,
}: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  useEffect(() => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));

      const restored = uploadedFiles
        .filter((name) => !existing.has(name))
        .map((name) => ({
          name,
          size: 0,
          status: "done" as const,
          selected: false,
        }));

      return [...prev, ...restored];
    });
  }, [uploadedFiles]);

  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const arr = Array.from(fileList);
    setFiles((prev) => [
      ...prev,
      ...arr.map((f) => ({
        name: f.name,
        size: f.size,
        status: "uploading" as const,
        selected: false,
      })),
    ]);

    for (const file of arr) {
      const form = new FormData();
      form.append("file", file);
      try {
        await fetch(`${API}/upload`, {
          method: "POST",
          body: form,
          credentials: "include", // ← sends auth cookie — fixes 401
        });
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "done" } : f,
          ),
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "error" } : f,
          ),
        );
      }
    }
  }

  function toggleSelect(name: string) {
    setFiles((prev) =>
      prev.map((f) => (f.name === name ? { ...f, selected: !f.selected } : f)),
    );
  }

  function useAsContext() {
    const selected = files
      .filter((f) => f.selected && f.status === "done")
      .map((f) => f.name);
    setContextFiles(selected);
    onRunWithFiles(); // go to Overview
  }

  const selectedCount = files.filter(
    (f) => f.selected && f.status === "done",
  ).length;
  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-lg font-semibold mb-1">Upload Files</h2>
        <p className="text-sm text-zinc-500 mb-6">
          Upload files, select them as context, then run agents on them.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all
            ${
              dragging
                ? "border-green-500 bg-green-500/5 scale-[1.01]"
                : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/40"
            }`}
        >
          <div className="text-4xl mb-3">📂</div>
          <p className="text-sm font-medium text-zinc-300 mb-1">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-zinc-600">
            Supports .txt, .pdf, .py, .md, .json and more
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* File list with checkboxes */}
      {files.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="font-semibold">Uploaded Files</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {doneCount} ready · {doneCount} ready · {contextFiles.length}{" "}
                active
              </p>
            </div>
            {selectedCount > 0 ? (
              <button
                onClick={useAsContext}
                className="px-5 py-2.5 rounded-xl bg-green-500 text-black font-bold text-sm
                           hover:bg-green-400 transition-colors flex items-center gap-2"
              >
                ▶ Use as Context &amp; Run
              </button>
            ) : doneCount > 0 ? (
              <p className="text-xs text-zinc-500 italic">
                Select files below to use as agent context
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            {files.map((f, i) => (
              <div
                key={i}
                onClick={() => f.status === "done" && toggleSelect(f.name)}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-all
                  ${f.status === "done" ? "cursor-pointer" : "cursor-default opacity-60"}
                  ${
                    f.selected
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                  }`}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center
                  ${f.selected ? "border-green-500 bg-green-500" : "border-zinc-600"}`}
                >
                  {f.selected && (
                    <span className="text-black text-xs font-black">✓</span>
                  )}
                </div>

                <span className="text-xl flex-shrink-0">
                  {f.name.endsWith(".pdf")
                    ? "📕"
                    : f.name.endsWith(".py")
                      ? "🐍"
                      : f.name.endsWith(".md")
                        ? "📝"
                        : f.name.endsWith(".json")
                          ? "📋"
                          : "📄"}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {f.name}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {(f.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                <span
                  className={`text-xs font-semibold flex-shrink-0
                  ${
                    f.status === "done"
                      ? "text-green-400"
                      : f.status === "error"
                        ? "text-red-400"
                        : "text-amber-400"
                  }`}
                >
                  {f.status === "done"
                    ? "✓ Ready"
                    : f.status === "error"
                      ? "✗ Failed"
                      : "↑ Uploading…"}
                </span>
              </div>
            ))}
          </div>

          {/* Active context indicator */}
          {contextFiles.length > 0 && (
            <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-green-400 font-semibold">
                  ✓ {contextFiles.length} file
                  {contextFiles.length > 1 ? "s" : ""} active as agent context
                </p>

                <button
                  onClick={() => {
                    setContextFiles([]);
                    localStorage.removeItem("contextFiles");
                  }}
                  className="text-xs px-2 py-1 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  Clear
                </button>
              </div>

              <p className="text-xs text-zinc-500 truncate mt-1">
                {contextFiles.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Steps guide */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
          How it works
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            {
              n: "1",
              t: "Upload",
              d: "Drop your PDF, code, or text files above",
            },
            {
              n: "2",
              t: "Select",
              d: "Check the files you want agents to read",
            },
            { n: "3", t: "Run", d: "Click 'Use as Context & Run' → Overview" },
          ].map((s) => (
            <div key={s.n}>
              <div
                className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20
                              text-green-400 text-sm font-bold flex items-center justify-center mx-auto mb-2"
              >
                {s.n}
              </div>
              <p className="text-xs font-semibold text-zinc-300 mb-1">{s.t}</p>
              <p className="text-xs text-zinc-600">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
