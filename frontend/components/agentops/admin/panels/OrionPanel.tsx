import { motion } from "framer-motion";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { fadeUp, panelAnim } from "../animation";

import Card, { SectionLabel } from "../AdminCard";
import StatCard from "../AdminStats";

// ═══════════════════════════════════════════════════════════════
//  PANEL: ORION
// ═══════════════════════════════════════════════════════════════
export default function OrionPanel() {
  const [stats, setStats] = useState({
    total_installs: 0,
    active_devices: 0,
    verified_devices: 0,
    online_today: 0,
  });

  const [devices, setDevices] = useState<any[]>([]);
  const [activity, setActivity] = useState({
    screens_analyzed: 0,
    ocr_requests: 0,
    vision_fallbacks: 0,
    assistant_queries: 0,
  });
  const [versions, setVersions] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [verification, setVerification] = useState({
    verified: 0,
    unverified: 0,
    blocked: 0,
    expired: 0,
  });
  useEffect(() => {
  const load = async () => {
  try {

    const statsRes =
      await apiFetch("/admin/orion/stats");

    if (statsRes.ok) {
      const statsData = await statsRes.json();

      setStats(statsData);

      setVerification({
        verified: statsData.verified_devices,
        unverified: 0,
        blocked: 0,
        expired: 0,
      });
    }

    const devicesRes =
      await apiFetch("/admin/orion/devices");

    if (devicesRes.ok) {
      setDevices(await devicesRes.json());
    }

    const activityRes =
      await apiFetch("/admin/orion/activity");

    if (activityRes.ok) {
      setActivity(await activityRes.json());
    }

    const versionsRes =
      await apiFetch("/admin/orion/versions");

    if (versionsRes.ok) {
      setVersions(await versionsRes.json());
    }

    setErrors([]);

  } catch (err) {
    console.error(err);
  }
};

  load();
  const id = setInterval(load, 10000);

  return () => clearInterval(id);
}, []);


  const safeDevices = Array.isArray(devices) ? devices : [];
  const safeVersions = Array.isArray(versions) ? versions : [];
  const safeErrors = Array.isArray(errors) ? errors : [];

  const statusMeta: Record<string, string> = {
    Online: "border border-green-500/20 bg-green-500/10 text-green-400",
    Idle: "border border-amber-500/20 bg-amber-500/10 text-amber-400",
    Offline: "border border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
  };

  const verificationRows = [
    { label: "Verified", value: verification.verified, accent: "text-green-400" },
    { label: "Unverified", value: verification.unverified, accent: "text-amber-400" },
    { label: "Blocked", value: verification.blocked, accent: "text-red-400" },
    { label: "Expired Session", value: verification.expired, accent: "text-zinc-400" },
  ];

  return (
    <motion.div
      key="orion"
      variants={panelAnim}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-4"
    >
      {/* Orion installs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Installs"
          value={stats.total_installs.toLocaleString()}
          sub="Across all platforms"
          trend="neutral"
          accent="green"
          delay={0}
          icon="⬇"
        />
        <StatCard
          label="Active Devices"
          value={stats.active_devices.toLocaleString()}
          sub={`${
            stats.total_installs
              ? Math.round((stats.active_devices / stats.total_installs) * 100)
              : 0
          }% of installs`}
          trend="up"
          accent="blue"
          delay={0.04}
          icon="⬡"
        />
        <StatCard
          label="Verified Devices"
          value={stats.verified_devices.toLocaleString()}
          sub={`${
            stats.total_installs
              ? Math.round((stats.verified_devices / stats.total_installs) * 100)
              : 0
          }% verified`}
          trend="neutral"
          accent="amber"
          delay={0.08}
          icon="✓"
        />
        <StatCard
          label="Online Today"
          value={stats.online_today.toLocaleString()}
          sub="Last 24h"
          trend="up"
          accent="green"
          delay={0.12}
          icon="●"
        />
      </div>

      {/* Activity + Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Orion activity */}
        <motion.div
          custom={0.16}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-3"
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Orion Activity</SectionLabel>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse" />
                <span className="font-mono text-[10px] text-neutral-600">
                  Live
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Screens Analyzed",
                  value: activity.screens_analyzed,
                  icon: "🖥",
                  accent: "text-cyan-400",
                },
                {
                  label: "OCR Requests",
                  value: activity.ocr_requests,
                  icon: "🔍",
                  accent: "text-blue-400",
                },
                {
                  label: "Vision Fallbacks",
                  value: activity.vision_fallbacks,
                  icon: "↺",
                  accent: "text-amber-400",
                },
                {
                  label: "Assistant Queries",
                  value: activity.assistant_queries,
                  icon: "💬",
                  accent: "text-green-400",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs">{s.icon}</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-700">
                      {s.label}
                    </span>
                  </div>
                  <p className={`font-mono text-[18px] font-semibold ${s.accent}`}>
                    {s.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Verification status */}
        <motion.div
          custom={0.2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2"
        >
          <Card className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Verification Status</SectionLabel>
              <span className="cursor-pointer font-mono text-[10px] text-green-500 hover:text-green-400 transition-colors">
                Manage →
              </span>
            </div>

            <div className="space-y-1.5">
              {verificationRows.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
                >
                  <p className="text-[12px] text-neutral-300">{r.label}</p>
                  <p className={`font-mono text-[13px] font-semibold ${r.accent}`}>
                    {r.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Device table */}
      <motion.div
        custom={0.24}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Connected Devices</SectionLabel>
            <span className="cursor-pointer font-mono text-[10px] text-green-500 hover:text-green-400 transition-colors">
              View all →
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {["Device", "User", "Version", "OS", "Last Seen", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="font-mono text-[9px] uppercase tracking-widest text-neutral-700 pb-2 pr-4"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {safeDevices.map((d: any, i) => {
                  const cls =
                    statusMeta[d.status] ??
                    "border border-zinc-500/20 bg-zinc-500/10 text-zinc-400";
                  return (
                    <tr
                      key={i}
                      className="border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-2.5 pr-4 text-[12px] font-medium text-neutral-200">
                        {d.device_name}
                      </td>
                      <td className="py-2.5 pr-4 text-[12px] text-neutral-400">
                        {d.user_email}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-[11px] text-neutral-500">
                        {d.version}
                      </td>
                      <td className="py-2.5 pr-4 text-[12px] text-neutral-400">
                        {d.os}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-[11px] text-neutral-600">
                        {d.last_seen}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${cls}`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Versions + Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Desktop versions */}
        <motion.div
          custom={0.28}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2"
        >
          <Card className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Desktop Versions</SectionLabel>
            </div>

            <div className="space-y-2">
              {safeVersions.map((v: any) => {
                const total = safeVersions.reduce(
                  (sum, x) => sum + x.users,
                  0
                );
                const pct = total ? Math.round((v.users / total) * 100) : 0;
                return (
                  <div key={v.version}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] text-neutral-300">
                        {v.version}
                      </span>
                      <span className="font-mono text-[11px] text-neutral-500">
                        {v.users} users
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500/70 to-emerald-400/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Error monitoring */}
        <motion.div
          custom={0.32}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-3"
        >
          <Card className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Error Monitoring</SectionLabel>
              <span className="cursor-pointer font-mono text-[10px] text-green-500 hover:text-green-400 transition-colors">
                View logs →
              </span>
            </div>

            <div className="space-y-0.5 max-h-[240px] overflow-y-auto pr-1">
              {safeErrors.map((e: any, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-red-500/20 bg-red-500/10 text-xs text-red-400">
                    ✕
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-neutral-200 truncate">
                      {e.message}
                    </p>
                    <p className="text-[11px] text-neutral-600 truncate">
                      {e.device_name} · {e.user_email}
                    </p>
                  </div>
                  <span className="flex-shrink-0 font-mono text-[10px] text-neutral-700">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
              {safeErrors.length === 0 && (
                <p className="text-[12px] text-neutral-600 px-2 py-4 text-center">
                  No errors reported
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}