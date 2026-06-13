import { API } from "@/lib/api";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Card, { Badge, Dot, SectionLabel } from "../AdminCard";

import { fadeUp, panelAnim } from "../animation";

import type { Service } from "../adminTypes";
export default function SystemPanel() {
  const [health, setHealth] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [type, setType] = useState("maintenance");

  const [priority, setPriority] = useState("medium");

  const [version, setVersion] = useState("");

  const [active, setActive] = useState(true);
  const [details, setDetails] = useState("");
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Health
        const res = await fetch(`${API}/system/health`, {
          credentials: "include",
        });

        setHealth(await res.json());

        // Admin updates
        const updatesRes = await fetch(`${API}/admin/updates`, {
          credentials: "include",
        });

        if (updatesRes.ok) {
          const data = await updatesRes.json();

          console.log("UPDATES", data);

          setUpdates(Array.isArray(data) ? data : []);
        } else {
          // 403 for non-admin users
          setUpdates([]);
        }
      } catch (err) {
        console.error(err);
        setUpdates([]);
      }
    };

    load();

    const id = setInterval(load, 5000);

    return () => clearInterval(id);
  }, []);

  const publishUpdate = async () => {
    try {
      const endpoint = editingId
        ? `${API}/admin/updates/${editingId}`
        : `${API}/admin/updates`;

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title,
          message,
          details,
          type,
          priority,
          version,
          active,
          show_banner: showBanner,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save update");
      }

      // Reset edit mode
      setEditingId(null);

      // Clear form
      setTitle("");
      setMessage("");
      setVersion("");

      // Refresh list
      const updatesRes = await fetch(`${API}/admin/updates`, {
        credentials: "include",
      });

      if (updatesRes.ok) {
        const data = await updatesRes.json();

        setUpdates(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUpdate = async (id: string) => {
    await fetch(`${API}/admin/updates/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const updatesRes = await fetch(`${API}/admin/updates`, {
      credentials: "include",
    });

    setUpdates(await updatesRes.json());
  };
  const toggleUpdate = async (id: string) => {
    await fetch(`${API}/admin/updates/${id}/toggle`, {
      method: "PATCH",
      credentials: "include",
    });

    const updatesRes = await fetch(`${API}/admin/updates`, {
      credentials: "include",
    });

    setUpdates(await updatesRes.json());
  };
  const backendServices: Service[] = [
    {
      name: "API Server",
      sub: "FastAPI",
      latency: `${health?.api?.latency ?? "-"} ms`,
      uptime: "Live",
      status: health?.api?.status === "online" ? "online" : "offline",
      statusLabel: health?.api?.status ?? "offline",
    },
  ];
  const databaseServices: Service[] = [
    {
      name: "PostgreSQL",
      sub: "Primary Database",
      latency: `${health?.postgres?.latency ?? "-"} ms`,
      uptime: "Live",
      status: health?.postgres?.status === "online" ? "online" : "offline",
      statusLabel: health?.postgres?.status ?? "offline",
    },
  ];
  const storageServices: Service[] = [
    {
      name: "Storage",
      sub: "Supabase Storage",
      latency: `${health?.storage?.latency ?? "-"} ms`,
      uptime: "Live",
      status: health?.storage?.status === "online" ? "online" : "offline",
      statusLabel: health?.storage?.status === "online" ? "online" : "offline",
    },
  ];
  const cacheServices: Service[] = [
    {
      name: "Redis",
      sub: "Cache Layer",
      latency: `${health?.redis?.latency ?? "-"} ms`,
      uptime: "Live",
      status: health?.redis?.status === "online" ? "online" : "offline",
      statusLabel: health?.redis?.status ?? "offline",
    },
  ];
  const safeUpdates = Array.isArray(updates) ? updates : [];

  // useEffect(() => {
  //   apiFetch("/admin/system")
  //     .then((r) => r.json())
  //     .then(setSystem);
  // }, []);

  return (
    <motion.div
      key="system"
      variants={panelAnim}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-4"
    >
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card className="p-4">
          <SectionLabel>Platform Announcement</SectionLabel>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs text-neutral-500">Title</label>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="
            mt-1
            w-full
            rounded-xl
            border
            border-white/[0.08]
            bg-white/[0.02]
            px-3
            py-2
            text-sm
          "
                placeholder="Scheduled Maintenance"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-500">Message</label>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="
            mt-1
            w-full
            rounded-xl
            border
            border-white/[0.08]
            bg-white/[0.02]
            px-3
            py-2
            text-sm
          "
                placeholder="Database migration..."
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500">Details</label>

              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={5}
                className="
      mt-1
      w-full
      rounded-xl
      border
      border-white/[0.08]
      bg-white/[0.02]
      px-3
      py-2
      text-sm
    "
                placeholder="
List changes, fixes, maintenance notes...
"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-neutral-500">Type</label>

                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="
              mt-1
              w-full
              rounded-xl
              border
              border-white/[0.08]
              bg-zinc-900
              px-3
              py-2
              text-sm
            "
                >
                  <option value="feature">Feature</option>

                  <option value="patch">Patch</option>

                  <option value="maintenance">Maintenance</option>

                  <option value="security">Security</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-500">Priority</label>

                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="
              mt-1
              w-full
              rounded-xl
              border
              border-white/[0.08]
              bg-zinc-900
              px-3
              py-2
              text-sm
            "
                >
                  <option value="low">Low</option>

                  <option value="medium">Medium</option>

                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-500">Version</label>

                <input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1.0.7"
                  className="
              mt-1
              w-full
              rounded-xl
              border
              border-white/[0.08]
              bg-white/[0.02]
              px-3
              py-2
              text-sm
            "
                />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Active
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showBanner}
                  onChange={(e) => setShowBanner(e.target.checked)}
                />
                Show Banner
              </label>
            </div>

            <button
              onClick={publishUpdate}
              className="
          rounded-xl
          bg-green-500
          px-4
          py-2
          text-sm
          font-semibold
          text-black
          hover:bg-green-400
          
        "
            >
              Publish Update
            </button>
            <p className="text-xs text-green-500">
              {updates.length} announcements published
            </p>
          </div>
        </Card>
      </motion.div>

      <Card className="p-4 mt-4">
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Recent Announcements</SectionLabel>

          <span className="text-xs text-neutral-500">
            {updates.length} total
          </span>
        </div>

        <div className="space-y-2">
          {safeUpdates.map((u: any) => (
            <div
              key={u.id}
              className="
          flex
          items-center
          justify-between
          rounded-xl
          border
          border-white/[0.06]
          bg-white/[0.02]
          p-3
        "
            >
              <div>
                <p className="text-sm font-medium text-neutral-200">
                  {u.title}
                </p>

                <p className="text-xs text-neutral-500">
                  {u.type} • {u.version}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(u.id);

                    setTitle(u.title);
                    setMessage(u.message);
                    setDetails(u.details || "");

                    setType(u.type);

                    setPriority(u.priority);

                    setVersion(u.version || "");

                    setActive(u.active);

                    setShowBanner(u.show_banner);
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleUpdate(u.id)}
                  className="
              px-2
              py-1
              text-xs
              rounded-md
              border
              border-amber-500/20
              text-amber-400
            "
                >
                  Disable
                </button>
                <button
                  onClick={() => deleteUpdate(u.id)}
                  className="
              px-2
              py-1
              text-xs
              rounded-md
              border
              border-red-500/20
              text-red-400
            "
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      {/* Alerts */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>Alerts</SectionLabel>
            <span className="font-mono text-[10px] text-red-400">2 active</span>
          </div>
          <div className="space-y-2">
            {safeUpdates.map((a: any, i) => {
              const levelConfig = {
                maintenance: {
                  level: "warning",
                  badge: "amber",
                  dot: "amber",
                },

                patch: {
                  level: "info",
                  badge: "blue",
                  dot: "blue",
                },

                feature: {
                  level: "info",
                  badge: "green",
                  dot: "green",
                },

                security: {
                  level: "critical",
                  badge: "red",
                  dot: "red",
                },
              };
              const cfg = {
                critical: {
                  bg: "bg-red-500/[0.05]",
                  border: "border-red-500/20",
                  dot: "red" as const,
                  badge: "red" as const,
                },
                warning: {
                  bg: "bg-amber-500/[0.05]",
                  border: "border-amber-500/20",
                  dot: "amber" as const,
                  badge: "amber" as const,
                },
                info: {
                  bg: "bg-blue-500/[0.05]",
                  border: "border-blue-500/15",
                  dot: "blue" as const,
                  badge: "blue" as const,
                },
              }[levelConfig[a.type]?.level || "info"];

              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 ${cfg.bg} ${cfg.border}`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <Dot status={cfg.dot} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-semibold text-neutral-200">
                        {a.title}
                      </p>
                      <Badge label={a.type} variant={cfg.badge} />
                    </div>
                    <p className="text-[12px] text-neutral-500 leading-relaxed">
                      {a.message}
                    </p>
                    <p className="mt-1.5 font-mono text-[10px] text-neutral-700">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button className="flex-shrink-0 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-neutral-600 hover:text-neutral-300 transition-colors">
                    Dismiss
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Service Groups */}
      <ServiceGroup
        title="Backend Status"
        services={backendServices}
        delay={0.08}
      />
      <ServiceGroup
        title="Database Status"
        services={databaseServices}
        delay={0.14}
      />
      <ServiceGroup
        title="Storage Status"
        services={storageServices}
        delay={0.2}
      />
      <ServiceGroup
        title="Cache Status"
        services={cacheServices}
        delay={0.26}
      />

      {/* Settings */}
      {/* <motion.div
        custom={0.32}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card className="p-4">
          <SectionLabel>Settings</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: "👥",
                accent: "green",
                label: "User Limits",
                desc: "Per-plan run & token quotas. Set hard caps and overage behaviour.",
              },
              {
                icon: "🛡",
                accent: "blue",
                label: "Security",
                desc: "API key rotation, SSO configuration, IP allowlists.",
              },
              {
                icon: "🔧",
                accent: "amber",
                label: "Maintenance",
                desc: "Schedule downtime windows, run migrations, flush caches.",
              },
              {
                icon: "📋",
                accent: "green",
                label: "Audit Logs",
                desc: "Full admin action history with actor, timestamp, and diff.",
              },
              {
                icon: "📣",
                accent: "blue",
                label: "Notifications",
                desc: "Alert routing: email, Slack, PagerDuty, webhook.",
              },
              {
                icon: "⚙",
                accent: "gray",
                label: "Feature Flags",
                desc: "Enable / disable features per plan or individual users.",
              }, */}
      {/* ].map((s, i) => (
              <button
                key={i}
                className="group flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:border-white/[0.1] hover:bg-white/[0.04]"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-base
                  ${
                    s.accent === "green"
                      ? "border border-green-500/20 bg-green-500/10"
                      : s.accent === "blue"
                        ? "border border-blue-500/20 bg-blue-500/10"
                        : s.accent === "amber"
                          ? "border border-amber-500/20 bg-amber-500/10"
                          : "border border-white/[0.08] bg-white/[0.04]"
                  }`}
                >
                  {s.icon}
                </div>
                <p className="text-[13px] font-semibold text-neutral-300 group-hover:text-white transition-colors">
                  {s.label}
                </p>
                <p className="text-[11px] leading-relaxed text-neutral-600">
                  {s.desc}
                </p>
              </button>
            ))}
          </div>
        </Card>
      </motion.div>*/}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SERVICE ROW
// ═══════════════════════════════════════════════════════════════

export function ServiceRow({ svc }: { svc: Service }) {
  const dotColor =
    svc.status === "online"
      ? "green"
      : svc.status === "degraded"
        ? "amber"
        : "red";
  const valColor =
    svc.status === "online"
      ? "text-green-400"
      : svc.status === "degraded"
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-none hover:bg-white/[0.02] transition-colors px-1 rounded-md">
      <div className="flex items-center gap-2.5">
        <Dot status={dotColor} />
        <div>
          <p className="text-[12px] font-medium text-neutral-200">{svc.name}</p>
          <p className="font-mono text-[10px] text-neutral-600">{svc.sub}</p>
        </div>
      </div>
      <div className="flex items-center gap-6 text-right">
        <div>
          <p className="font-mono text-[10px] text-neutral-600">latency</p>
          <p className="font-mono text-[11px] text-neutral-400">
            {svc.latency}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] text-neutral-600">uptime</p>
          <p className="font-mono text-[11px] text-neutral-400">{svc.uptime}</p>
        </div>
        <span
          className={`font-mono text-[11px] font-semibold w-20 text-right ${valColor}`}
        >
          {svc.statusLabel}
        </span>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════
//  SYSTEM SERVICE GROUP
// ═══════════════════════════════════════════════════════════════

export function ServiceGroup({
  title,
  services,
  delay = 0,
}: {
  title: string;
  services: Service[];
  delay?: number;
}) {
  const anyDown = services.some((s) => s.status !== "online");
  return (
    <motion.div
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <SectionLabel>{title}</SectionLabel>
          {anyDown ? (
            <Badge label="Degraded" variant="amber" />
          ) : (
            <Badge label="All Healthy" variant="green" />
          )}
        </div>
        <div>
          {services.map((s, i) => (
            <ServiceRow key={i} svc={s} />
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
