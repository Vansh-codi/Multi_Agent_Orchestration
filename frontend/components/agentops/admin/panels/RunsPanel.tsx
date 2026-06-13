import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import Card, { Badge, SectionLabel } from "../AdminCard";
import StatCard from "../AdminStats";

import { apiFetch } from "@/lib/api";
import { fadeUp, panelAnim } from "../animation";
interface Run {
  id: string;
  goal: string;
  status: string;
  tokens_used: number;
  created_at: string;
}
export default function RunsPanel() {
  const [runQuery, setRunQuery] = useState("");
  const [runs, setRuns] = useState<Run[]>([]);
  // const statusBadge: Record<RunStatus, "green" | "red" | "amber" | "blue"> = {
  //   OK: "green",
  //   Timeout: "red",
  //   Partial: "amber",
  //   Error: "red",
  // };

  const [stats, setStats] = useState({
    total_runs: 0,
    completed_runs: 0,
    failed_runs: 0,
    total_tokens: 0,
  });

  const filteredRuns = runs.filter(
    (r) =>
      r.id.includes(runQuery) ||
      r.goal.toLowerCase().includes(runQuery.toLowerCase()),
  );
  useEffect(() => {
    const load = async () => {
      try {
        const [runsRes, statsRes] = await Promise.all([
          apiFetch("/admin/runs"),
          apiFetch("/admin/runs/stats"),
        ]);

        setRuns(await runsRes.json());
        setStats(await statsRes.json());
      } catch (err) {
        console.error(err);
      }
    };

    load();

    const id = setInterval(load, 5000);

    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      key="runs"
      variants={panelAnim}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-4"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Runs"
          value={stats.total_runs.toLocaleString()}
          sub="Today"
          accent="green"
          delay={0}
        />
        <StatCard
          label="Successful"
          value={stats.completed_runs.toLocaleString()}
          sub="94.2% success rate"
          accent="green"
          delay={0.05}
        />
        <StatCard
          label="Failures"
          value={stats.failed_runs.toLocaleString()}
          sub="5.8% failure rate"
          accent="red"
          delay={0.1}
        />
        <StatCard
          label="Tokens Used"
          value={stats.total_tokens.toLocaleString()}
          sub="All runs"
          accent="amber"
          delay={0.15}
        />
        {/* <StatCard
          label="Avg Duration"
          value="4.2s"
          sub="↑ 0.3s vs yday"
          accent="amber"
          delay={0.15}
        /> */}
      </div>
      {/* Route Usage + Failures
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Route Usage */}
      {/* <motion.div
          custom={0.18}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        > */}{" "}
      */
      {/* <Card className="p-4">
            <SectionLabel>Route Usage</SectionLabel>
            <div className="space-y-4">
              {ROUTE_USAGE.map((r, i) => (
                <div key={i}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: r.color }}
                      /> */}
      {/* <span className="text-[13px] font-medium text-neutral-300">
                        {r.name}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-neutral-500">
                      {r.count.toLocaleString()} runs
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.pct}%` }}
                      transition={{ */}
      {/* duration: 0.7,
                        delay: i * 0.08,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: r.color }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-neutral-700">
                    {r.pct}% of total
                  </p>
                </div>
              ))}
            </div> */}
      {/* Token distribution */}
      {/* <div className="mt-5 border-t border-white/[0.04] pt-4">
              <SectionLabel>Token Distribution</SectionLabel>
              <div className="flex h-2 w-full overflow-hidden rounded-full gap-0.5">
                {ROUTE_USAGE.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ width: 0 }}
                    animate={{ width: `${r.pct}%` }}
                    transition={{
                      duration: 0.7,
                      delay: 0.4 + i * 0.05,
                      ease: "easeOut",
                    }}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ backgroundColor: r.color }}
                    title={r.name}
                  />
                ))} */}
      {/* </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {ROUTE_USAGE.map((r) => (
                  <div key={r.name} className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: r.color }}
                    />
                    <span className="font-mono text-[10px] text-neutral-600">
                      {r.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div> */}
      {/* Failures */}
      {/* <motion.div
          custom={0.22}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Card className="p-4">
            <SectionLabel>Failure Breakdown</SectionLabel>
            <div className="space-y-1 mb-5">
              {[
                {
                  icon: "⏱",
                  color: "red",
                  label: "Timeout",
                  desc: "Coder agent · requests >30s",
                  count: 203,
                  pct: 42,
                },
                {
                  icon: "🗄",
                  color: "red",
                  label: "RAG error",
                  desc: "Vector store connection drop",
                  count: 147,
                  pct: 30,
                },
                {
                  icon: "🔒",
                  color: "amber",
                  label: "Auth failure",
                  desc: "Token expired mid-run",
                  count: 87,
                  pct: 18,
                },
                {
                  icon: "🐛",
                  color: "amber",
                  label: "Parse error",
                  desc: "Malformed agent output",
                  count: 50,
                  pct: 10,
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 hover:bg-white/[0.03] transition-colors"
                >
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-sm
                    ${
                      f.color === "red"
                        ? "border border-red-500/20 bg-red-500/10"
                        : "border border-amber-500/20 bg-amber-500/10"
                    }`}
                  >
                    {f.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[12px] font-medium text-neutral-300">
                        {f.label}
                      </p>
                      <span
                        className={`font-mono text-[12px] font-bold ${f.color === "red" ? "text-red-400" : "text-amber-400"}`}
                      >
                        {f.count}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${f.pct}%` }}
                        transition={{
                          duration: 0.6,
                          delay: i * 0.07 + 0.2,
                          ease: "easeOut",
                        }}
                        className={`h-full rounded-full ${f.color === "red" ? "bg-red-500/60" : "bg-amber-500/60"}`}
                      />
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-neutral-700">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div> */}
      {/* Error rate over time (mini sparkline)
            <div className="border-t border-white/[0.04] pt-4">
              <SectionLabel>Failure Rate · 7 days</SectionLabel>
              <div className="flex items-end gap-1 h-10">
                {WEEK_DATA.map((d, i) => {
                  const rate = Math.round((d.fail / d.runs) * 100);
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col justify-end"
                      title={`${d.day}: ${rate}% failure`}
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${rate * 10}%` }}
                        transition={{
                          duration: 0.5,
                          delay: i * 0.05,
                          ease: "easeOut",
                        }}
                        className={`w-full rounded-sm min-h-[2px] ${rate > 5 ? "bg-red-500/70" : "bg-white/[0.1]"}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between">
                {WEEK_DATA.map((d) => (
                  <span
                    key={d.day}
                    className="flex-1 text-center font-mono text-[9px] text-neutral-700"
                  >
                    {d.day}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div> */}
      {/* Run Explorer */}
      <motion.div
        custom={0.26}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <SectionLabel>Run Explorer</SectionLabel>
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={runQuery}
                onChange={(e) => setRunQuery(e.target.value)}
                placeholder="Filter runs…"
                className="h-7 w-44 rounded-lg border border-white/[0.06] bg-white/[0.03] pl-7 pr-2 font-mono text-[11px] text-neutral-400 placeholder-neutral-700 outline-none transition-all focus:border-green-500/30"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {[
                    "Run ID",
                    // "Agent",
                    "Goal",
                    "Created",
                    // "Duration",
                    "Tokens",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap pb-2.5 pr-4 font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((r, i) => (
                  <tr
                    key={r.id}
                    className="group border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] cursor-pointer"
                  >
                    <td className="py-2.5 pr-4 font-mono text-[11px] text-neutral-600">
                      {r.id}
                    </td>
                    <td className="py-2.5 pr-4 text-[12px] font-medium text-neutral-300">
                      {/* {r.agent} */}
                    </td>
                    <td className="py-2.5 pr-4 max-w-[200px]">
                      <span className="block truncate text-[11px] text-neutral-500">
                        {r.goal}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[11px] text-neutral-500">
                      {/* {r.duration} */}
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[11px] text-neutral-400">
                      {r.tokens_used}
                    </td>
                    <td className="py-2.5">
                      <Badge
                        label={r.status}
                        variant={r.status === "completed" ? "green" : "red"}
                      />
                      {/* // variant={statusBadge[r.status]}  */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
