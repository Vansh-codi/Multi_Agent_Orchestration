"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type UpdateType = "feature" | "patch" | "maintenance" | "security" | "breaking";
type Priority = "low" | "medium" | "high";
type Filter = "all" | "feature" | "patch" | "maintenance" | "security";

interface Update {
  id: string;
  version?: string;
  title: string;
  message: string;
  type: UpdateType;
  priority: Priority;
  showBanner: boolean;
  details?: string;
  timestamp: string;
  timeAgo: number; // seconds ago for live ticker
  read: boolean;
  likes: number;
  dislikes: number;
  userVote: "like" | "dislike" | null;
  tags: string[];
  changes?: string[];
}

// ── Data ───────────────────────────────────────────────────────────────────────

// ── Color system ───────────────────────────────────────────────────────────────
const TYPE_THEME = {
  feature: {
    label: "New Feature",
    icon: "✦",
    glow: "#22c55e",
    dim: "#166534",
    text: "#4ade80",
    bg: "rgba(34,197,94,0.06)",
    border: "rgba(34,197,94,0.2)",
  },
  patch: {
    label: "Patch",
    icon: "◈",
    glow: "#38bdf8",
    dim: "#075985",
    text: "#7dd3fc",
    bg: "rgba(56,189,248,0.06)",
    border: "rgba(56,189,248,0.2)",
  },
  maintenance: {
    label: "Maintenance",
    icon: "◎",
    glow: "#fb923c",
    dim: "#9a3412",
    text: "#fdba74",
    bg: "rgba(251,146,60,0.06)",
    border: "rgba(251,146,60,0.2)",
  },
  security: {
    label: "Security",
    icon: "⬡",
    glow: "#f43f5e",
    dim: "#881337",
    text: "#fb7185",
    bg: "rgba(244,63,94,0.06)",
    border: "rgba(244,63,94,0.2)",
  },
  breaking: {
    label: "Breaking",
    icon: "⚡",
    glow: "#c084fc",
    dim: "#6b21a8",
    text: "#d8b4fe",
    bg: "rgba(192,132,252,0.06)",
    border: "rgba(192,132,252,0.2)",
  },
};

// ParticleBg removed — pure black platform background

// ── Live pulse dot ─────────────────────────────────────────────────────────────
function PulseDot({ color = "#22c55e" }: { color?: string }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        width: 10,
        height: 10,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: color,
          opacity: 0.4,
          animation: "ao-ping 1.4s ease-out infinite",
        }}
      />
      <span
        style={{
          position: "relative",
          display: "inline-flex",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
    </span>
  );
}

// ── Animated counter ───────────────────────────────────────────────────────────
function AnimCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    const diff = value - prev.current;
    const steps = 12;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplay(Math.round(prev.current + (diff * i) / steps));
      if (i >= steps) {
        clearInterval(id);
        prev.current = value;
      }
    }, 20);
    return () => clearInterval(id);
  }, [value]);
  return <>{display}</>;
}

// ── Neon Rail Banner ───────────────────────────────────────────────────────────
// Horizontal scrolling marquee rail — matches the vertical neon bars on the platform
function NeonRailBanner({ update }: { update: Update | undefined }) {
  const [gone, setGone] = useState(false);
  if (!update || gone) return null;
  const items = [
    `⚠ ${update.title}`,
    update.message,
    update.version || "Platform Update",
    `⚠ ${update.title}`,
    update.message,
  ];

  const ticker = items.join("   •   ");

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 32,
        background: "#080808",
        borderBottom: "1px solid rgba(251,146,60,0.25)",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        animation: "ao-slideDown 0.35s ease",
      }}
    >
      {/* left neon edge marker */}
      <div
        style={{
          flexShrink: 0,
          width: 3,
          height: "100%",
          background: "linear-gradient(to bottom, #fb923c, #f59e0b, #fb923c)",
          boxShadow: "0 0 10px #fb923c, 0 0 20px #fb923c60",
          marginRight: 12,
        }}
      />

      {/* label pill */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(251,146,60,0.08)",
          border: "1px solid rgba(251,146,60,0.3)",
          borderRadius: 4,
          padding: "2px 10px",
          marginRight: 16,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#fb923c",
            boxShadow: "0 0 6px #fb923c",
            display: "inline-block",
            animation: "ao-ping 1.4s ease-out infinite",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.14em",
            color: "#fb923c",
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          MAINTENANCE
        </span>
      </div>

      {/* scrolling ticker */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {/* left fade */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 40,
            zIndex: 2,
            background: "linear-gradient(to right, #080808, transparent)",
            pointerEvents: "none",
          }}
        />
        {/* right fade */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 40,
            zIndex: 2,
            background: "linear-gradient(to left, #080808, transparent)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
            animation: "ao-marquee 22s linear infinite",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "#fdba74",
            fontFamily: "'JetBrains Mono', monospace",
            gap: 0,
          }}
        >
          {/* double the content so it loops seamlessly */}
          <span>{ticker}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span>{ticker}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        </div>
      </div>

      {/* dismiss */}
      <button
        onClick={() => setGone(true)}
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          color: "#78350f",
          cursor: "pointer",
          fontSize: 14,
          padding: "0 10px",
          lineHeight: 1,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "#fb923c";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "#78350f";
        }}
        aria-label="Dismiss"
      >
        ×
      </button>

      {/* right neon edge marker */}
      <div
        style={{
          flexShrink: 0,
          width: 3,
          height: "100%",
          background: "linear-gradient(to bottom, #f59e0b, #fb923c, #f59e0b)",
          boxShadow: "0 0 10px #fb923c, 0 0 20px #fb923c60",
          marginLeft: 2,
        }}
      />
    </div>
  );
}

// ── Stats card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        flex: 1,
        minWidth: 110,
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${color}25`,
        borderRadius: 12,
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.3s, box-shadow 0.3s",
        animation: visible ? "ao-fadeUp 0.5s ease both" : "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = color + "60";
        (e.currentTarget as HTMLElement).style.boxShadow =
          `0 0 20px ${color}15`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = color + "25";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -10,
          right: -10,
          fontSize: 36,
          opacity: 0.06,
          userSelect: "none",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 10,
          color: "#4b5563",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color,
          fontFamily: "monospace",
          lineHeight: 1,
        }}
      >
        <AnimCount value={value} />
      </div>
      <div
        style={{
          marginTop: 8,
          height: 2,
          borderRadius: 1,
          background: color + "20",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, value * 15)}%`,
            background: color,
            borderRadius: 1,
            transition: "width 1s ease",
          }}
        />
      </div>
    </div>
  );
}

// ── Type badge ─────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: UpdateType }) {
  const t = TYPE_THEME[type];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: t.text,
        background: t.bg,
        padding: "3px 10px",
        borderRadius: 99,
        border: `1px solid ${t.border}`,
      }}
    >
      <span style={{ fontSize: 11 }}>{t.icon}</span>
      {t.label}
    </span>
  );
}

// ── Update card ────────────────────────────────────────────────────────────────
function UpdateCard({
  update,
  index,
  onVote,
  onMarkRead,
}: {
  update: Update;
  index: number;
  onVote: (id: string, v: "like" | "dislike") => void;
  onMarkRead: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const t = TYPE_THEME[update.type];

  return (
    <div
      style={{
        background: hovered
          ? "rgba(255,255,255,0.025)"
          : "rgba(255,255,255,0.015)",
        border: `1px solid ${hovered ? t.border : update.read ? "#1e1e1e" : t.border + "80"}`,
        borderRadius: 14,
        padding: "18px 20px",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 8px 32px ${t.glow}12, 0 0 0 1px ${t.border}`
          : (update.read ?? false)
            ? "none"
            : `0 0 0 1px ${t.border}40, 0 4px 20px ${t.glow}06`,
        animation: `ao-fadeUp 0.45s ease ${index * 80}ms both`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        setExpanded((e) => !e);
        onMarkRead(update.id);
      }}
    >
      {/* glow sweep on hover */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 14,
          background: `radial-gradient(ellipse at 50% 0%, ${t.glow}08 0%, transparent 65%)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: "none",
        }}
      />

      {/* Left accent */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "12%",
          bottom: "12%",
          width: 3,
          borderRadius: "0 3px 3px 0",
          background: `linear-gradient(to bottom, ${t.glow}, ${t.dim})`,
          boxShadow: `0 0 8px ${t.glow}60`,
          opacity: hovered ? 1 : 0.6,
          transition: "opacity 0.25s",
        }}
      />

      {/* Unread indicator */}
      {!update.read && (
        <div style={{ position: "absolute", top: 16, right: 16 }}>
          <PulseDot color={t.glow} />
        </div>
      )}

      <div style={{ paddingLeft: 8 }}>
        {/* Row 1: badges + time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <TypeBadge type={update.type} />

          {update.version && (
            <span
              style={{
                fontSize: 10,
                color: "#6b7280",
                fontFamily: "monospace",
                background: "#161616",
                padding: "2px 8px",
                borderRadius: 6,
                border: "1px solid #2a2a2a",
                letterSpacing: "0.04em",
              }}
            >
              {update.version}
            </span>
          )}

          {update.priority === "high" && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#ef4444",
                background: "rgba(239,68,68,0.08)",
                padding: "2px 8px",
                borderRadius: 99,
                border: "1px solid rgba(239,68,68,0.2)",
                textTransform: "uppercase",
                animation: "ao-pulse 2s ease-in-out infinite",
              }}
            >
              ⚠ HIGH PRIORITY
            </span>
          )}

          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "#374151",
              fontFamily: "monospace",
            }}
          >
            {update.timestamp}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: 15,
            fontWeight: 700,
            color: hovered ? "#ffffff" : "#e2e8f0",
            letterSpacing: "-0.02em",
            transition: "color 0.2s",
            lineHeight: 1.3,
          }}
        >
          {update.title}
        </h3>

        {/* Message */}
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 13,
            color: "#6b7280",
            lineHeight: 1.65,
            display: expanded ? "block" : "-webkit-box",
            WebkitLineClamp: expanded ? undefined : 2,
            WebkitBoxOrient: "vertical",
            overflow: expanded ? "visible" : "hidden",
            transition: "all 0.3s",
          }}
        >
          {update.message}
        </p>

        {/* Changelog items */}
        {/* {expanded && update.changes && (
          <div
            style={{
              marginBottom: 14,
              background: "rgba(0,0,0,0.3)",
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: "10px 14px",
              animation: "ao-fadeUp 0.25s ease both",
            }}
          >
            {(update.changes || []).map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "4px 0",
                  borderBottom:
                    i < update.changes!.length - 1
                      ? "1px solid #1a1a1a"
                      : "none",
                }}
              >
                <span
                  style={{
                    color: t.glow,
                    fontSize: 12,
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                >
                  →
                </span>
                <span
                  style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}
                >
                  {c}
                </span>
              </div>
            ))}
          </div>
        )} */}
        {expanded && (
          <div
            style={{
              marginBottom: 14,
              background: "rgba(0,0,0,0.3)",
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: "10px 14px",
              animation: "ao-fadeUp 0.25s ease both",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {update.details || "No additional details provided"}
            </div>
          </div>
        )}

        {/* Tags + vote row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {(update.tags || []).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                color: "#4b5563",
                fontFamily: "monospace",
                background: "#111",
                padding: "2px 7px",
                borderRadius: 5,
                border: "1px solid #1e1e1e",
              }}
            >
              #{tag}
            </span>
          ))}

          {/* expand toggle */}
          <span
            style={{
              marginLeft: 4,
              fontSize: 11,
              color: t.text,
              opacity: 0.7,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {expanded ? "▲ less" : "▼ details"}
          </span>

          {/* Vote buttons */}
          <div
            style={{ marginLeft: "auto", display: "flex", gap: 5 }}
            onClick={(e) => e.stopPropagation()}
          >
            {(["like", "dislike"] as const).map((v) => {
              const active = update.userVote === v;
              const cnt =
                v === "like" ? (update.likes ?? 0) : (update.dislikes ?? 0);
              const col = v === "like" ? "#22c55e" : "#f43f5e";
              return (
                <button
                  key={v}
                  onClick={() => onVote(update.id, v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: active ? `${col}18` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? col + "50" : "#222"}`,
                    borderRadius: 8,
                    padding: "5px 11px",
                    cursor: "pointer",
                    fontSize: 12,
                    color: active ? col : "#4b5563",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    transition: "all 0.2s",
                    transform: active ? "scale(1.05)" : "scale(1)",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        col + "40";
                      (e.currentTarget as HTMLElement).style.color = col + "aa";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#222";
                      (e.currentTarget as HTMLElement).style.color = "#4b5563";
                    }
                  }}
                >
                  {v === "like" ? "↑" : "↓"} <AnimCount value={cnt} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Timeline sidebar ───────────────────────────────────────────────────────────
function VersionTimeline({ updates }: { updates: Update[] }) {
  const versioned = updates.filter((u) => u.version);
  return (
    <div style={{ position: "relative", paddingLeft: 2 }}>
      <div
        style={{
          position: "absolute",
          left: 10,
          top: 0,
          bottom: 0,
          width: 1,
          background:
            "linear-gradient(to bottom, #22c55e40, #22c55e10, transparent)",
        }}
      />
      {versioned.map((u, i) => {
        const t = TYPE_THEME[u.type];
        return (
          <div
            key={u.id}
            style={{
              display: "flex",
              gap: 14,
              paddingBottom: 20,
              animation: `ao-fadeUp 0.4s ease ${i * 100 + 200}ms both`,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                flexShrink: 0,
                background: "#0d0d0d",
                border: `2px solid ${t.glow}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                zIndex: 1,
                color: t.glow,
                boxShadow: `0 0 10px ${t.glow}40`,
              }}
            >
              {t.icon}
            </div>
            <div style={{ paddingTop: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#e2e8f0",
                    fontFamily: "monospace",
                  }}
                >
                  {u.version}
                </span>
                <span style={{ fontSize: 10, color: "#374151" }}>
                  {u.timestamp}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "#4b5563",
                  lineHeight: 1.5,
                }}
              >
                {u.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── System status ──────────────────────────────────────────────────────────────
const SERVICES = [
  { name: "API Gateway", ok: true, latency: "12ms" },
  { name: "WebSocket", ok: true, latency: "8ms" },
  { name: "RAG / Chroma", ok: true, latency: "45ms" },
  { name: "Redis Bus", ok: true, latency: "3ms" },
  { name: "Groq LLM", ok: true, latency: "220ms" },
  { name: "Code Sandbox", ok: false, latency: "—" },
];

function SystemStatus() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);
  const allOk = SERVICES.every((s) => s.ok);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.015)",
        border: "1px solid #1e1e1e",
        borderRadius: 14,
        padding: "18px",
        animation: "ao-fadeUp 0.5s ease 0.3s both",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "#4b5563",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          System Status
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 5,
            color: allOk ? "#22c55e" : "#f59e0b",
          }}
        >
          <PulseDot color={allOk ? "#22c55e" : "#f59e0b"} />
          {allOk ? "All Operational" : "Partial Outage"}
        </span>
      </div>

      {SERVICES.map((s, i) => (
        <div
          key={s.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 0",
            borderTop: i > 0 ? "1px solid #111" : "none",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: s.ok ? "#22c55e" : "#f59e0b",
              boxShadow: `0 0 5px ${s.ok ? "#22c55e" : "#f59e0b"}`,
              flexShrink: 0,
              animation: s.ok ? "none" : "ao-pulse 1.5s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: 12, color: "#9ca3af", flex: 1 }}>
            {s.name}
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              color: s.ok ? "#374151" : "#f59e0b",
            }}
          >
            {s.latency}
          </span>
        </div>
      ))}

      <div
        style={{
          marginTop: 12,
          padding: "8px 10px",
          background: "rgba(34,197,94,0.04)",
          border: "1px solid rgba(34,197,94,0.1)",
          borderRadius: 8,
          fontSize: 10,
          color: "#374151",
          textAlign: "center",
          fontFamily: "monospace",
        }}
      >
        last checked · {tick}s ago
      </div>
    </div>
  );
}

// ── Filter pill ────────────────────────────────────────────────────────────────
const FILTER_DEFS: { key: Filter; label: string; color: string }[] = [
  { key: "all", label: "All", color: "#22c55e" },
  { key: "feature", label: "Features", color: TYPE_THEME.feature.glow },
  { key: "patch", label: "Patches", color: TYPE_THEME.patch.glow },
  {
    key: "maintenance",
    label: "Maintenance",
    color: TYPE_THEME.maintenance.glow,
  },
  { key: "security", label: "Security", color: TYPE_THEME.security.glow },
];

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MaintenancePage() {
  // const [updates, setUpdates] = useState<Update[]>(INITIAL_UPDATES);
  const [updates, setUpdates] = useState<Update[]>([]);
  const API = process.env.NEXT_PUBLIC_API_URL;
  const latest = updates.length > 0 ? updates[0] : null;

  useEffect(() => {
    const loadUpdates = async () => {
      try {
        const res = await fetch(`${API}/updates`, {
          credentials: "include",
        });

        const data = await res.json();

        console.log("PUBLIC UPDATES", data);

        setUpdates(
          Array.isArray(data)
            ? data.map((u: any) => ({
                ...u,

                timestamp: new Date(u.created_at).toLocaleDateString(),

                showBanner: u.show_banner,

                read: false,

                likes: u.likes || 0,
                dislikes: u.dislikes || 0,

                userVote: null,

                tags: [],

                changes: [],
              }))
            : [],
        );
      } catch (err) {
        console.error(err);
      }
    };

    loadUpdates();

    const interval = setInterval(loadUpdates, 10000); // refresh every 10 sec

    return () => clearInterval(interval);
  }, [API]);
  const [filter, setFilter] = useState<Filter>("all");
  const [marking, setMarking] = useState(false);
  const bannerUpdate = updates.find((u) => u.showBanner);

  const filtered = updates.filter((u) =>
    filter === "all" ? true : u.type === filter,
  );

  const unread = updates.filter((u) => !u.read).length;
  const features = updates.filter((u) => u.type === "feature").length;
  const patches = updates.filter((u) => u.type === "patch").length;
  const critical = updates.filter((u) => u.priority === "high").length;

  const handleVote = useCallback((id: string, vote: "like" | "dislike") => {
    setUpdates((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const same = u.userVote === vote;
        const wasOther = u.userVote && u.userVote !== vote;
        return {
          ...u,
          userVote: same ? null : vote,
          likes:
            vote === "like"
              ? u.likes + (same ? -1 : wasOther ? 1 : 1)
              : u.likes - (u.userVote === "like" ? 1 : 0),
          dislikes:
            vote === "dislike"
              ? u.dislikes + (same ? -1 : wasOther ? 1 : 1)
              : u.dislikes - (u.userVote === "dislike" ? 1 : 0),
        };
      }),
    );
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    setUpdates((prev) =>
      prev.map((u) => (u.id === id ? { ...u, read: true } : u)),
    );
  }, []);

  const handleMarkAll = async () => {
    setMarking(true);
    await new Promise((r) => setTimeout(r, 500));
    setUpdates((prev) => prev.map((u) => ({ ...u, read: true })));
    setMarking(false);
  };

  return (
    <>
      {/* ── Global keyframes ─────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@600;700;800&display=swap');

        @keyframes ao-ping {
          0%   { transform: scale(1);   opacity: 0.5; }
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes ao-pulse {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.45; }
        }
        @keyframes ao-fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes ao-slideDown {
          from { transform: translateY(-100%); opacity:0; }
          to   { transform: translateY(0);    opacity:1; }
        }
        @keyframes ao-slideUp {
          from { transform: translateY(0);    opacity:1; }
          to   { transform: translateY(-100%); opacity:0; }
        }
        @keyframes ao-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes ao-glow {
          0%,100% { box-shadow: 0 0 12px rgba(34,197,94,0.25); }
          50%     { box-shadow: 0 0 28px rgba(34,197,94,0.55); }
        }
        @keyframes ao-rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ao-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }
      `}</style>

      {/* Neon rail banner */}
      <NeonRailBanner update={bannerUpdate} />

      {/* Page wrapper */}
      <div
        style={{
          minHeight: "100vh",
          background: "#080808",
          fontFamily: "'Syne', system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Pure black platform background — no particles */}

        <div
          style={{ position: "relative", zIndex: 1, padding: "28px 28px 48px" }}
        >
          {/* ── Header ──────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 32,
              flexWrap: "wrap",
              gap: 16,
              animation: "ao-fadeUp 0.4s ease both",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                {/* animated spinner icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "1.5px solid rgba(34,197,94,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(34,197,94,0.06)",
                    animation: "ao-glow 3s ease-in-out infinite",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "conic-gradient(transparent 270deg, rgba(34,197,94,0.3) 360deg)",
                      animation: "ao-rotate 3s linear infinite",
                    }}
                  />
                  <span
                    style={{
                      position: "relative",
                      fontSize: 16,
                      color: "#22c55e",
                    }}
                  >
                    ◈
                  </span>
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#f1f5f9",
                    letterSpacing: "-0.03em",
                    fontFamily: "'Syne', system-ui, sans-serif",
                  }}
                >
                  Platform Updates
                </h1>

                {unread > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      color: "#000",
                      padding: "3px 10px",
                      borderRadius: 99,
                      animation: "ao-glow 2s ease-in-out infinite",
                    }}
                  >
                    {unread} new
                  </span>
                )}
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#4b5563",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.02em",
                }}
              >
                Release notes · patches · maintenance windows
              </p>
            </div>

            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={marking}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: marking ? "#374151" : "#22c55e",
                  background: marking ? "transparent" : "rgba(34,197,94,0.06)",
                  border: `1px solid ${marking ? "#1e1e1e" : "rgba(34,197,94,0.25)"}`,
                  borderRadius: 9,
                  padding: "8px 18px",
                  cursor: marking ? "default" : "pointer",
                  transition: "all 0.2s",
                  fontFamily: "'JetBrains Mono', monospace",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  if (!marking) {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(34,197,94,0.12)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(34,197,94,0.06)";
                }}
              >
                {marking ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        animation: "ao-rotate 0.6s linear infinite",
                      }}
                    >
                      ◌
                    </span>{" "}
                    marking…
                  </>
                ) : (
                  "✓ Mark all read"
                )}
              </button>
            )}
          </div>

          {/* ── Stats row ────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 28,
              flexWrap: "wrap",
            }}
          >
            <StatCard label="Unread" value={unread} color="#22c55e" icon="◈" />
            <StatCard
              label="Features"
              value={features}
              color="#38bdf8"
              icon="✦"
            />
            <StatCard
              label="Patches"
              value={patches}
              color="#fb923c"
              icon="◎"
            />
            <StatCard
              label="Critical"
              value={critical}
              color="#f43f5e"
              icon="⬡"
            />
          </div>

          {/* ── Main two-column grid ──────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 310px",
              gap: 18,
              alignItems: "start",
            }}
          >
            {/* LEFT — Feed */}
            <div>
              {/* Filter bar */}
              <div
                style={{
                  display: "flex",
                  gap: 3,
                  background: "rgba(34,197,94,0.04)",
                  border: "1px solid #1a1a1a",
                  borderRadius: 11,
                  padding: 4,
                  marginBottom: 18,
                  width: "fit-content",
                  animation: "ao-fadeUp 0.4s ease 0.15s both",
                }}
              >
                {FILTER_DEFS.map((f) => {
                  const active = filter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        background: active ? f.color : "transparent",
                        color: active ? "#000" : "#4b5563",
                        boxShadow: active ? `0 0 12px ${f.color}50` : "none",
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: "uppercase",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.color =
                            f.color;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.color =
                            "#4b5563";
                        }
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {/* Cards */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {filtered.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 0",
                      color: "#2d2d2d",
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <div
                      style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}
                    >
                      ◎
                    </div>
                    no updates in this category
                  </div>
                ) : (
                  filtered.map((u, i) => (
                    <UpdateCard
                      key={u.id}
                      update={u}
                      index={i}
                      onVote={handleVote}
                      onMarkRead={handleMarkRead}
                    />
                  ))
                )}
              </div>
            </div>

            {/* RIGHT — Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Current version card */}
              <div
                style={{
                  background: "rgba(34,197,94,0.04)",
                  border: "1px solid rgba(34,197,94,0.18)",
                  borderRadius: 14,
                  padding: "18px",
                  position: "relative",
                  overflow: "hidden",
                  animation: "ao-fadeUp 0.4s ease 0.1s both",
                }}
              >
                {/* bg shimmer */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(105deg, transparent 40%, rgba(34,197,94,0.04) 50%, transparent 60%)",
                    backgroundSize: "200% 100%",
                    animation: "ao-shimmer 4s linear infinite",
                    pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    fontSize: 10,
                    color: "#4b5563",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Current Version
                </div>
                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 800,
                    color: "#22c55e",
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1,
                    marginBottom: 4,
                    textShadow: "0 0 30px rgba(34,197,94,0.5)",
                  }}
                >
                  {/* v1.0.6 */}
                  {latest?.version || "N/A"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#374151",
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: 14,
                  }}
                >
                  {/* Released · 2h ago */}
                  {latest?.title || "No updates"}
                </div>
                <div
                  style={{
                    padding: "8px 12px",
                    background: "rgba(34,197,94,0.08)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 11,
                    color: "#4ade80",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <PulseDot color="#22c55e" />
                  Platform up to date
                </div>
              </div>

              {/* System status */}
              <SystemStatus />

              {/* Version history */}
              <div
                style={{
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid #1a1a1a",
                  borderRadius: 14,
                  padding: "18px",
                  animation: "ao-fadeUp 0.5s ease 0.4s both",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#4b5563",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  Version History
                </div>
                <VersionTimeline updates={updates} />
              </div>

              {/* Notify CTA */}
              <div
                style={{
                  background: "rgba(255,255,255,0.015)",
                  border: "1px dashed rgba(34,197,94,0.15)",
                  borderRadius: 14,
                  padding: "16px",
                  textAlign: "center",
                  animation: "ao-fadeUp 0.5s ease 0.5s both",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(ellipse at 50% 100%, rgba(34,197,94,0.05) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
                <div style={{ fontSize: 22, marginBottom: 6 }}>🔔</div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#d1fae5",
                    marginBottom: 4,
                  }}
                >
                  Email Notifications
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#374151",
                    marginBottom: 12,
                    lineHeight: 1.5,
                  }}
                >
                  Get notified for critical patches and new features.
                </div>
                <button
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#000",
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 20px",
                    cursor: "pointer",
                    width: "100%",
                    boxShadow: "0 0 18px rgba(34,197,94,0.35)",
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: "box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 0 28px rgba(34,197,94,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 0 18px rgba(34,197,94,0.35)";
                  }}
                >
                  Subscribe — Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
