"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface GeneratedFile {
  name: string;
  size: number;
  url?: string;
  storage_path?: string;
  created_at?: string;
}

const EXT_ICONS: Record<string, string> = {
  py: "🐍",
  js: "🟨",
  ts: "🔷",
  tsx: "⚛️",
  txt: "📄",
  md: "📝",
  json: "📋",
};

function fileIcon(name: string) {
  const ext = name.split(".").pop() ?? "";

  return EXT_ICONS[ext] ?? "📁";
}

export default function FilesPanel() {
  const [files, setFiles] = useState<GeneratedFile[]>([]);

  const [loading, setLoading] = useState(true);

  const [preview, setPreview] = useState<{
    name: string;
    content: string;
  } | null>(null);

  // ─────────────────────────────────────────────
  // Fetch files from backend
  // ─────────────────────────────────────────────

  async function fetchFiles() {
    setLoading(true);

    try {
      const res = await fetch(`${API}/generated-files`, {
        credentials: "include",
      });

      const data = await res.json();

      // Backend now returns:
      // { files: [...] }

      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch (err) {
      console.error(err);

      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────
  // Preview file using signed URL
  // ─────────────────────────────────────────────

  async function openPreview(file: GeneratedFile) {
    try {
      if (!file.url) {
        throw new Error("Missing file URL");
      }

      const res = await fetch(file.url);

      const content = await res.text();

      setPreview({
        name: file.name,
        content,
      });
    } catch (err) {
      console.error(err);

      setPreview({
        name: file.name,
        content: "Could not load file.",
      });
    }
  }

  // delete----
  async function deleteFile(filename: string) {
    const confirmed = window.confirm(`Delete ${filename}?`);

    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API}/generated-files/${encodeURIComponent(filename)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      await fetchFiles();
    } catch (err) {
      console.error(err);
      alert("Failed to delete file");
    }
  }

  // ─────────────────────────────────────────────
  // Initial load
  // ─────────────────────────────────────────────

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900/60
        p-6
      "
    >
      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          mb-6
        "
      >
        <div>
          <h2
            className="
              text-lg
              font-semibold
            "
          >
            Generated Files
          </h2>

          <p
            className="
              text-xs
              text-zinc-500
              mt-0.5
            "
          >
            {files.length} file
            {files.length !== 1 ? "s" : ""} generated
          </p>
        </div>

        <button
          onClick={fetchFiles}
          className="
            px-4
            py-2
            rounded-xl
            border
            border-zinc-700
            text-sm
            text-zinc-400
            hover:border-green-500/40
            hover:text-green-400
            transition-colors
          "
        >
          ↻ Refresh
        </button>
      </div>

      {/* Loading */}

      {loading && (
        <p
          className="
            text-center
            py-12
            text-zinc-600
            text-sm
          "
        >
          Loading files…
        </p>
      )}

      {/* Empty */}

      {!loading && files.length === 0 && (
        <p
          className="
              text-center
              py-12
              text-zinc-600
              text-sm
            "
        >
          No files yet — run a goal from Overview to generate files.
        </p>
      )}

      {/* Files */}

      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.name}
            className="
              flex
              items-center
              gap-4
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              px-4
              py-3
            "
          >
            {/* Icon */}

            <span className="text-xl">{fileIcon(file.name)}</span>

            {/* File info */}

            <div
              className="
                flex-1
                min-w-0
              "
            >
              <p
                className="
                  text-sm
                  font-medium
                  text-zinc-200
                  truncate
                "
              >
                {file.name}
              </p>

              <p
                className="
                  text-xs
                  text-zinc-600
                "
              >
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>

            {/* Actions */}

            <div className="flex gap-2">
              {/* Preview */}

              <button
                onClick={() => openPreview(file)}
                className="
                  px-3
                  py-1.5
                  rounded-lg
                  border
                  border-zinc-700
                  text-xs
                  text-zinc-400
                  hover:border-zinc-500
                  hover:text-zinc-200
                  transition-colors
                "
              >
                Preview
              </button>

              {/* Download */}

              <a
                href={file.url}
                download={file.name}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  px-3
                  py-1.5
                  rounded-lg
                  bg-green-500
                  text-black
                  text-xs
                  font-bold
                  hover:bg-green-400
                  transition-colors
                "
              >
                Download
              </a>
              {/* Delete */}
              <button
                onClick={() => deleteFile(file.name)}
                className="
                px-3
                py-1.5
                rounded-lg
                border
                border-red-500/30
                text-xs
                text-red-400
                hover:bg-red-500/10
                hover:border-red-500
                transition-colors
               "
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ───────────────────────────────────── */}
      {/* Preview Modal */}
      {/* ───────────────────────────────────── */}

      {preview && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/70
            backdrop-blur-sm
          "
          onClick={() => setPreview(null)}
        >
          <div
            className="
              bg-zinc-900
              border
              border-zinc-700
              rounded-2xl
              p-6
              w-full
              max-w-2xl
              mx-4
              max-h-[80vh]
              flex
              flex-col
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}

            <div
              className="
                flex
                items-center
                justify-between
                mb-4
              "
            >
              <h3
                className="
                  font-semibold
                  text-sm
                "
              >
                {preview.name}
              </h3>

              <button
                onClick={() => setPreview(null)}
                className="
                  text-zinc-500
                  hover:text-white
                  text-xl
                  leading-none
                "
              >
                ✕
              </button>
            </div>

            {/* Content */}

            <pre
              className="
                flex-1
                overflow-auto
                text-xs
                text-zinc-300
                font-mono
                leading-relaxed
                bg-zinc-950
                rounded-xl
                p-4
                whitespace-pre-wrap
              "
            >
              {preview.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
