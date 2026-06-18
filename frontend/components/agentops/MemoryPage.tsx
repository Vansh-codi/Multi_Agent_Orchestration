import { useState, useMemo, useEffect, useRef } from "react"
import {
  Search, Pin, Trash2, User, FolderKanban, Sliders,
  Clock, Bot, PinOff, X, ChevronDown
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type MemoryCategory =
  | "about_me"
  | "projects"
  | "preferences"
  | "general"
  | "recent"
  | "orion"
  | "pinned"

interface MemoryItem {
  id: string
  category: Exclude<MemoryCategory, "recent" | "pinned">
  title: string
  content: string
  source?: string
  createdAt: string
  pinned: boolean
}

// ── Backend connection point ──────────────────────────────────────────────
// Replace this block with your real fetch calls. Shapes already match
// what the rest of the component expects, so swapping is a 1:1 drop-in.
//
//   GET    /memory                 -> MemoryItem[]
//   DELETE /memory/:id             -> 204
//   PATCH  /memory/:id  { pinned } -> MemoryItem
//
// async function fetchMemories(): Promise<MemoryItem[]> {
//   const res = await fetch("/api/memory", { credentials: "include" })
//   if (!res.ok) throw new Error("Failed to load memories")
//   return res.json()
// }
// async function deleteMemory(id: string) {
//   await fetch(`/api/memory/${id}`, { method: "DELETE", credentials: "include" })
// }
// async function togglePin(id: string, pinned: boolean) {
//   await fetch(`/api/memory/${id}`, {
//     method: "PATCH",
//     headers: { "Content-Type": "application/json" },
//     credentials: "include",
//     body: JSON.stringify({ pinned }),
//   })
// }
async function fetchMemories(): Promise<MemoryItem[]> {
  const res = await fetch(
    `${API}/memory`,
    {
      credentials: "include"
    }
  )

  if (!res.ok)
    throw new Error("Failed")

  return res.json()
}
// const MOCK_MEMORIES: MemoryItem[] = [
//   {
//     id: "m1",
//     category: "about_me",
//     title: "B.Tech in AI/ML",
//     content: "Studying AI/ML at Manipal University Jaipur. Has internship experience in software development.",
//     createdAt: "2026-06-10T09:00:00Z",
//     pinned: true,
//   },
//   {
//     id: "m2",
//     category: "preferences",
//     title: "Direct communication style",
//     content: "Prefers concise, single-track solutions over multi-option responses. Wants clean implementations.",
//     createdAt: "2026-06-12T14:20:00Z",
//     pinned: true,
//   },
//   {
//     id: "m3",
//     category: "projects",
//     title: "AgentOps platform",
//     content: "Full-stack AI agent orchestration platform built with Next.js, FastAPI, LangGraph, Chroma, Redis, and Postgres.",
//     source: "Chat · Jun 8",
//     createdAt: "2026-06-08T11:00:00Z",
//     pinned: false,
//   },
//   {
//     id: "m4",
//     category: "projects",
//     title: "Orion AI assistant",
//     content: "Building Orion, an AI assistant overlay for AgentOps available as a web sidebar and Electron desktop app.",
//     source: "Chat · Jun 14",
//     createdAt: "2026-06-14T16:30:00Z",
//     pinned: false,
//   },
//   {
//     id: "orion-1",
//     category: "preferences",
//     title: "Dark + green UI aesthetic",
//     content: "Prefers deep dark backgrounds with #3ddc84 green accents, full-width layouts, high text contrast, and minimal gaps.",
//     source: "Orion · Jun 13",
//     createdAt: "2026-06-13T10:15:00Z",
//     pinned: false,
//   },
//   {
//     id: "orion-2",
//     category: "projects",
//     title: "Screenshot OCR pipeline",
//     content: "Debugging Electron desktopCapturer to moondream OCR to cloud LLM pipeline for the Orion desktop overlay.",
//     source: "Orion · Jun 14",
//     createdAt: "2026-06-14T15:40:00Z",
//     pinned: false,
//   },
//   {
//     id: "m7",
//     category: "about_me",
//     title: "Applied to Amazon ML Summer School 2026",
//     content: "Submitted SOP highlighting Multi-Agent Orchestration, Live Detection System, and Blood Cancer Classification projects.",
//     createdAt: "2026-05-30T08:00:00Z",
//     pinned: false,
//   },
// ]

// ── Config ─────────────────────────────────────────────────────────────────
const API =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";
const TABS: { key: MemoryCategory; label: string; icon: typeof User }[] = [
  { key: "about_me", label: "About me", icon: User },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "preferences", label: "Preferences", icon: Sliders },
  { key: "recent", label: "Recent", icon: Clock },
  { key: "orion", label: "Orion", icon: Bot },
  { key: "pinned", label: "Pinned", icon: Pin },
  { key: "general", label: "General", icon: Clock },
]

const CATEGORY_LABEL: Record<MemoryItem["category"], string> = {
  orion: "Orion",
  about_me: "About me",
  general: "General",
  projects: "Projects",
  preferences: "Preferences",
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ── Component ──────────────────────────────────────────────────────────────

export default function MemoryPage() {
  const [memories, setMemories] =
  useState<MemoryItem[]>([])
  const [activeTab, setActiveTab] = useState<MemoryCategory>("about_me")
  const [query, setQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Swap this for your real fetch on mount:
  useEffect(() => {
    setLoading(true)
    fetchMemories().then(setMemories).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = memories

    if (activeTab === "pinned") {
      list = list.filter((m) => m.pinned)
    } else if (activeTab === "recent") {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } else if (activeTab === "orion") {
      list = list.filter((m) => m.source?.toLowerCase().startsWith("orion"))
    } else {
      list = list.filter((m) => m.category === activeTab)
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (m) => m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q)
      )
    }

    return list
  }, [memories, activeTab, query])

  // function handlePin(id: string) {
  //   setMemories((prev) =>
  //     prev.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
  //   )
  //   // togglePin(id, !memories.find(m => m.id === id)?.pinned)
  // }
  async function handlePin(id: string) {
  const target =
    memories.find(m => m.id === id)

  if (!target) return

  const pinned =
    !target.pinned

  await fetch(
  `${API}/memory/${id}`,
  {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pinned
    })
  }
)
  setMemories(prev =>
    prev.map(m =>
      m.id === id
        ? { ...m, pinned }
        : m
    )
  )
  setConfirmId(null)
}
async function handleDelete(id: string) {

  const res = await fetch(
    `${API}/memory/${id}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  )

  if (!res.ok) {
    alert("Failed to delete memory")
    return
  }

  setMemories(prev =>
    prev.filter(m => m.id !== id)
  )

  setConfirmId(null)
}

  // function handleDelete(id: string) {
  //   setMemories((prev) => prev.filter((m) => m.id !== id))
  //   setConfirmId(null)
  //   // deleteMemory(id)
  // }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === "Escape") setConfirmId(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const t of TABS) {
      if (t.key === "pinned") c[t.key] = memories.filter((m) => m.pinned).length
      else if (t.key === "recent") c[t.key] = memories.length
      else if (t.key === "orion") c[t.key] = memories.filter((m) => m.source?.toLowerCase().startsWith("orion")).length
      else c[t.key] = memories.filter((m) => m.category === t.key).length
    }
    return c
  }, [memories])

  return (
    <div className="mem-page">
      <style>{CSS}</style>

      <div className="mem-header">
        <div className="mem-header-text">
          <h1>Memory</h1>
          <p> Long-term memory shared across AgentOps and Orion.</p>
        </div>

        <div className={`mem-search ${searchFocused ? "is-focused" : ""}`}>
          <Search size={15} strokeWidth={2} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search memories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {query ? (
            <button className="mem-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={13} strokeWidth={2.5} />
            </button>
          ) : (
            <kbd>⌘K</kbd>
          )}
        </div>
      </div>

      <div className="mem-tabs" role="tablist">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = activeTab === t.key
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              className={`mem-tab ${active ? "is-active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              <Icon size={14} strokeWidth={2} />
              <span>{t.label}</span>
              {counts[t.key] > 0 && <span className="mem-tab-count">{counts[t.key]}</span>}
            </button>
          )
        })}
      </div>

      <div className="mem-grid">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="mem-card mem-skeleton" />)
        ) : filtered.length === 0 ? (
          <div className="mem-empty">
            <Search size={20} strokeWidth={1.5} />
            <p>{query ? `No memories match "${query}"` : "No memories in this category yet"}</p>
          </div>
        ) : (
          filtered.map((m) => (
            <div key={m.id} className="mem-card">
              <div className="mem-card-top">
                <span className="mem-card-tag">{CATEGORY_LABEL[m.category]}</span>
                <div className="mem-card-actions">
                  <button
                    className={`mem-icon-btn ${m.pinned ? "is-pinned" : ""}`}
                    onClick={() => handlePin(m.id)}
                    aria-label={m.pinned ? "Unpin memory" : "Pin memory"}
                    title={m.pinned ? "Unpin" : "Pin"}
                  >
                    {m.pinned ? <Pin size={14} strokeWidth={2} fill="currentColor" /> : <Pin size={14} strokeWidth={2} />}
                  </button>
                  <button
                    className="mem-icon-btn mem-icon-btn-danger"
                    onClick={() => setConfirmId(m.id)}
                    aria-label="Delete memory"
                    title="Delete"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>

              <h3 className="mem-card-title">{m.title}</h3>
              <p className="mem-card-content">{m.content}</p>

              <div className="mem-card-foot">
                <span>{m.source ?? "Inferred"}</span>
                <span className="mem-dot">·</span>
                <span>{timeAgo(m.createdAt)}</span>
              </div>

              {confirmId === m.id && (
                <div className="mem-confirm">
                  <p>Delete this memory? This can't be undone.</p>
                  <div className="mem-confirm-actions">
                    <button className="mem-btn-ghost" onClick={() => setConfirmId(null)}>
                      Cancel
                    </button>
                    <button className="mem-btn-danger" onClick={() => handleDelete(m.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────
// Tuned to match the existing AgentOps surfaces: near-black bg, #3ddc84
// accent used sparingly, 1px hairline borders, monospace for small labels.

const CSS = `
.mem-page {
  width: 100%;
  color: #e5e7eb;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.mem-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}
.mem-header-text h1 {
  font-size: 22px;
  font-weight: 600;
  color: #f3f4f6;
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}
.mem-header-text p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.mem-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0d0f0d;
  border: 1px solid #1f2421;
  border-radius: 8px;
  padding: 8px 12px;
  width: 280px;
  color: #6b7280;
  transition: border-color 0.15s ease;
}
.mem-search.is-focused {
  border-color: #2f7a52;
}
.mem-search input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e5e7eb;
  font-size: 13px;
}
.mem-search input::placeholder { color: #52525b; }
.mem-search kbd {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  color: #4b5563;
  background: #161816;
  border: 1px solid #262a27;
  border-radius: 4px;
  padding: 2px 5px;
}
.mem-search-clear {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  padding: 2px;
  border-radius: 4px;
}
.mem-search-clear:hover { color: #e5e7eb; }

.mem-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #1a1d1a;
  margin-bottom: 24px;
  overflow-x: auto;
}
.mem-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  padding: 10px 14px;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  transition: color 0.15s ease;
}
.mem-tab:hover { color: #b3b8b5; }
.mem-tab.is-active { color: #3ddc84; }
.mem-tab.is-active::after {
  content: "";
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: -1px;
  height: 2px;
  background: #3ddc84;
  border-radius: 2px 2px 0 0;
}
.mem-tab-count {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  color: #84908a;
  background: #14171450;
  border: 1px solid #232723;
  border-radius: 10px;
  padding: 1px 6px;
  line-height: 1.4;
}
.mem-tab.is-active .mem-tab-count {
  color: #0a2e1c;
  background: #3ddc84;
  border-color: #3ddc84;
}

.mem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.mem-card {
  background: #0c0e0c;
  border: 1px solid #1a1d1a;
  border-radius: 12px;
  padding: 16px;
  position: relative;
  transition: border-color 0.15s ease, transform 0.1s ease;
}
.mem-card:hover {
  border-color: #2a2f2b;
}

.mem-skeleton {
  height: 140px;
  background: linear-gradient(90deg, #0c0e0c 0%, #14171450 50%, #0c0e0c 100%);
  background-size: 200% 100%;
  animation: mem-shimmer 1.4s ease-in-out infinite;
}
@keyframes mem-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.mem-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.mem-card-tag {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #5dcaa5;
  background: #0f2d2450;
  border: 1px solid #1d4030;
  border-radius: 5px;
  padding: 3px 7px;
}

.mem-card-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.mem-card:hover .mem-card-actions { opacity: 1; }
.mem-icon-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 5px;
  border-radius: 6px;
  display: flex;
  transition: background 0.12s ease, color 0.12s ease;
}
.mem-icon-btn:hover { background: #1a1d1a; color: #e5e7eb; }
.mem-icon-btn.is-pinned { color: #3ddc84; opacity: 1; }
.mem-icon-btn-danger:hover { background: #2a1414; color: #ef4444; }

.mem-card.is-pinned-card .mem-card-actions { opacity: 1; }

.mem-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #f3f4f6;
  margin: 0 0 6px;
  line-height: 1.4;
}
.mem-card-content {
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.6;
  margin: 0 0 14px;
}

.mem-card-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #52525b;
  font-family: ui-monospace, monospace;
}
.mem-dot { color: #34403a; }

.mem-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #52525b;
  padding: 64px 0;
  font-size: 13px;
}

.mem-confirm {
  position: absolute;
  inset: 0;
  background: #0a0c0a;
  border: 1px solid #2a1414;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.mem-confirm p {
  font-size: 13px;
  color: #d1d5db;
  margin: 0;
}
.mem-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.mem-btn-ghost {
  background: none;
  border: 1px solid #262a27;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.mem-btn-ghost:hover { color: #e5e7eb; border-color: #3a3f3b; }
.mem-btn-danger {
  background: #ef4444;
  border: 1px solid #ef4444;
  color: #0a0c0a;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.mem-btn-danger:hover { background: #f87171; }

@media (max-width: 640px) {
  .mem-search { width: 100%; }
  .mem-header { flex-direction: column; align-items: stretch; }
}
`