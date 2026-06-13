"use client";
import { motion } from "framer-motion";
import {
  Activity,
  FileImage,
  FileSpreadsheet,
  FileText,
  Mic,
  Search,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const tools = [
  {
    name: "CSV Analyzer",
    icon: FileSpreadsheet,
    color: "bg-emerald-500/10 text-emerald-400",
    status: "Live",
  },
  {
    name: "OCR Reader",
    icon: FileImage,
    color: "bg-sky-500/10 text-sky-400",
    status: "Live",
  },
  {
    name: "PDF Parser",
    icon: FileText,
    color: "bg-violet-500/10 text-violet-400",
    status: "Coming Soon",
  },
  {
    name: "Audio Transcriber",
    icon: Mic,
    color: "bg-orange-500/10 text-orange-400",
    status: "Planned",
  },
];

export default function DashboardPage() {
  const [pipeline, setPipeline] = useState({
    upload: "waiting",
    extract: "waiting",
    chunk: "waiting",
    embed: "waiting",
    index: "waiting",
    retrieve: "waiting",
  });
  // const token = useAuthStore((state) => state.token);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeTool, setActiveTool] = useState<"csv" | "ocr" | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stats, setStats] = useState({
    documents: 0,
    chunks: 0,
    requests: 0,
  });
  async function loadStats() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tools/stats`,
        {
          credentials: "include",
        },
      );

      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  }
  useEffect(() => {
    loadStats();
  }, []);

  const [jobs, setJobs] = useState<
    {
      file: string;
      status: string;
      chunks: number;
    }[]
  >([]);
  async function loadJobs() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tools/jobs`, {
        credentials: "include",
      });

      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
    }
  }
  useEffect(() => {
    loadJobs();
  }, []);

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);

      let endpoint = "";

      const ext = file.name.split(".").pop()?.toLowerCase();

      if (["csv", "xlsx", "xls"].includes(ext || "")) {
        endpoint = "/tools/csv";
      } else if (["png", "jpg", "jpeg", "webp"].includes(ext || "")) {
        endpoint = "/tools/ocr";
      } else {
        throw new Error("Unsupported file type");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }
      setResult(data);

      if (data.pipeline) {
        setPipeline(data.pipeline);
      }

      if (endpoint === "/tools/csv") {
        setActiveTool("csv");
      }

      if (endpoint === "/tools/ocr") {
        setActiveTool("ocr");
      }

      await loadStats();
      await loadJobs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };
  const statCards = [
    {
      title: "Documents",
      value: (stats?.documents ?? 0).toLocaleString(),
      icon: FileText,
    },
    {
      title: "Indexed Chunks",
      value: (stats?.chunks ?? 0).toLocaleString(),
      icon: Search,
    },
    {
      title: "Requests",
      value: (stats?.requests ?? 0).toLocaleString(),
      icon: Activity,
    },
  ];
  const pipelineSteps = [
    { label: "Upload", status: pipeline.upload },
    { label: "Extract", status: pipeline.extract },
    { label: "Chunk", status: pipeline.chunk },
    { label: "Embed", status: pipeline.embed },
    { label: "Index", status: pipeline.index },
    { label: "Retrieve", status: pipeline.retrieve },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4 mb-6">
          {statCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="
                  bg-zinc-900
                  border
                  border-zinc-800
                  rounded-xl
                  p-4
                  hover:border-emerald-500/30
                  hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]
                  transition-all
                "
              >
                <div className="flex items-center justify-between">
                  <p className="text-zinc-500 text-sm">{item.title}</p>

                  <Icon className="w-4 h-4 text-zinc-600" />
                </div>

                <h2 className="text-2xl font-bold mt-3">{item.value}</h2>
              </div>
            );
          })}
        </div>

        {/* Upload + Pipeline */}

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Upload */}

          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-semibold text-lg mb-4">Upload Center</h3>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);

                const file = e.dataTransfer.files?.[0];

                if (file) {
                  handleFile(file);
                }
              }}
              className={`
                relative
                h-56
                rounded-2xl
                overflow-hidden
                border
                transition-all
                ${
                  dragging
                    ? "border-emerald-400 bg-emerald-500/10"
                    : "border-zinc-700"
                }
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />

              <div className="relative h-full flex flex-col items-center justify-center">
                <Upload className="w-10 h-10 text-emerald-400 mb-3" />

                <h4 className="font-semibold text-lg">Drag & Drop Files</h4>

                <p className="text-zinc-400 text-sm mt-2">
                  CSV • PDF • Images • Audio
                </p>

                {selectedFile && (
                  <>
                    <div className="mt-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs text-emerald-400">
                        {selectedFile.name}
                      </p>
                    </div>

                    {/* {uploading && (
                      <p className="mt-3 text-sm text-yellow-400">
                        Processing...
                      </p>
                    )} */}
                    {uploading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3"
                      >
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            animate={{
                              x: ["-100%", "100%"],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.2,
                              ease: "linear",
                            }}
                            className="h-full w-1/3 bg-emerald-500"
                          />
                        </div>

                        <p className="mt-2 text-xs text-zinc-400">
                          Extracting chunks...
                        </p>
                      </motion.div>
                    )}

                    {result && (
                      <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                        <p className="text-xs text-emerald-400">
                          {result.message}
                        </p>

                        <p className="text-xs text-zinc-400 mt-1">
                          {result.preview}
                        </p>
                      </div>
                    )}

                    {error && (
                      <p className="mt-3 text-sm text-red-400">{error}</p>
                    )}
                  </>
                )}

                {/* <div className="mt-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-400">
                      {selectedFile.name}
                    </p>
                  </div>
                )} */}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="
                    mt-5
                    px-4
                    py-2
                    rounded-lg
                    bg-emerald-500
                    hover:bg-emerald-400
                    text-black
                    font-medium
                    transition
                  "
                >
                  Browse Files
                </button>

                <input
                  ref={fileInputRef}
                  hidden
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      handleFile(file);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Pipeline */}

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-semibold text-lg mb-5">Pipeline Status</h3>

            {pipelineSteps.map((step) => {
              const color =
                step.status === "complete"
                  ? "bg-emerald-400"
                  : step.status === "ready"
                    ? "bg-blue-400"
                    : step.status === "running"
                      ? "bg-yellow-400"
                      : "bg-zinc-600";

              return (
                <div
                  key={step.label}
                  className="flex items-center justify-between py-4 border-b border-zinc-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    <span>{step.label}</span>
                  </div>

                  <span className="text-sm text-zinc-400 capitalize">
                    {step.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {/* Tools */}

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg">Available Tools</h3>

            <span className="text-zinc-500 text-sm">
              {tools.length} Services
            </span>
          </div>

          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <div
                  key={tool.name}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-xl
                    border
                    border-zinc-800
                    bg-black
                    p-4
                    hover:border-emerald-500
                    hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]
                    transition-all
                  "
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-emerald-500/10 to-transparent" />

                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${tool.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <h4 className="font-semibold mt-4">{tool.name}</h4>

                    <p className="text-xs text-zinc-500 mt-1">{tool.status}</p>

                    <button
                      onClick={() => {
                        if (tool.name === "CSV Analyzer") {
                          setActiveTool("csv");
                        }

                        if (tool.name === "OCR Reader") {
                          setActiveTool("ocr");
                        }
                      }}
                      className="
    mt-4
    w-full
    py-2
    rounded-lg
    bg-zinc-800
    hover:bg-emerald-500
    hover:text-black
    transition
  "
                    >
                      Open Tool
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {activeTool === "csv" && result && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">CSV Analyzer</h3>

            <div className="space-y-3">
              <p>
                <span className="text-zinc-500">File:</span> {result.filename}
              </p>

              <p>
                <span className="text-zinc-500">Chunks:</span> {result.chunks}
              </p>

              <div className="rounded-xl bg-black border border-zinc-800 p-4">
                <pre className="text-xs text-zinc-300 whitespace-pre-wrap">
                  {result.preview}
                </pre>
              </div>
            </div>
          </div>
        )}
        {activeTool === "ocr" && result && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">OCR Reader</h3>

            <div className="rounded-xl bg-black border border-zinc-800 p-4">
              <pre className="text-sm text-zinc-300 whitespace-pre-wrap">
                {result.preview}
              </pre>
            </div>
          </div>
        )}

        {/* Recent Jobs */}

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="font-semibold text-lg mb-5">Recent Jobs</h3>

          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.file}
                className="
                  flex
                  justify-between
                  items-center
                  bg-black
                  border
                  border-zinc-800
                  rounded-xl
                  p-4
                  hover:border-emerald-500/30
                  transition
                "
              >
                <div>
                  <p className="font-medium">{job.file}</p>

                  <p className="text-xs text-zinc-500">
                    {job.chunks} chunks indexed
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />

                  <span className="text-sm text-emerald-400">{job.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
