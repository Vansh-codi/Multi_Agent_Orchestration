import { motion } from "framer-motion";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { fadeUp, panelAnim } from "../animation";

import Card, { SectionLabel } from "../AdminCard";
import StatCard, { WeekChart } from "../AdminStats";

// ═══
// ════════════════════════════════════════════════════════════
//  PANEL: OVERVIEW
// ═══════════════════════════════════════════════════════════════
export default function OverviewPanel() {
  const [stats, setStats] = useState({
    total_users: 0,
    new_users_week: 0,

    active_users: 0,

    total_runs: 0,
    runs_change: 0,

    success_rate: 0,
    success_rate_change: 0,

    tokens_today: 0,
    tokens_change: 0,

    failures: 0,
    failures_change: 0,
  });
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ day: string; runs: number }[]>(
    [],
  );
  useEffect(() => {
    const load = async () => {
      try {
        const activityRes = await apiFetch("/admin/activity");

        setActivities(await activityRes.json());

        const statsRes = await apiFetch("/admin/stats");

        setStats(await statsRes.json());

        const chartRes = await apiFetch("/admin/runs/chart");

        const chartJson = await chartRes.json();

        console.log("CHART RESPONSE", chartJson);

        setChartData(chartJson);

        const topUsersRes = await apiFetch("/admin/top-users");

        setTopUsers(await topUsersRes.json());
      } catch (err) {
        console.error(err);
      }
    };

    load();

    const id = setInterval(load, 5000);

    return () => clearInterval(id);
  }, []);

  const safeChartData = Array.isArray(chartData) ? chartData : [];
  const safeTopUsers = Array.isArray(topUsers) ? topUsers : [];
  const safeActivities = Array.isArray(activities) ? activities : [];

  const weekTotal = safeChartData.reduce((sum, day) => sum + day.runs, 0);

  const avgDay =
    safeChartData.length > 0 ? Math.round(weekTotal / safeChartData.length) : 0;

  const peakDay =
    safeChartData.length > 0
      ? [...safeChartData].sort((a, b) => b.runs - a.runs)[0]
      : null;
  console.log("activities", activities);

  const activityMeta = {
    user: {
      icon: "👤",
      className: "border border-green-500/20 bg-green-500/10 text-green-400",
    },

    login: {
      icon: "🔑",
      className: "border border-blue-500/20 bg-blue-500/10 text-blue-400",
    },

    planner: {
      icon: "▶",
      className: "border border-amber-500/20 bg-amber-500/10 text-amber-400",
    },

    github: {
      icon: "🐙",
      className: "border border-purple-500/20 bg-purple-500/10 text-purple-400",
    },

    file: {
      icon: "📄",
      className: "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
    },
  };

  return (
    <motion.div
      key="overview"
      variants={panelAnim}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-4"
    >
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          label="Total Users"
          value={stats.total_users.toLocaleString()}
          // sub="↑ 12 this week"
          sub={`↑ ${stats.new_users_week} this week`}
          trend="up"
          accent="green"
          delay={0}
          icon="👤"
        />
        <StatCard
          label="Active Users"
          value={stats.active_users.toLocaleString()}
          sub={`${
            stats.total_users
              ? Math.round((stats.active_users / stats.total_users) * 100)
              : 0
          }% of total`}
          trend="neutral"
          accent="blue"
          delay={0.04}
          icon="⚡"
        />
        <StatCard
          label="Runs Today"
          value={stats.total_runs.toLocaleString()}
          sub={`${
            stats.runs_change >= 0 ? "↑" : "↓"
          } ${Math.abs(stats.runs_change)}% vs yday`}
          trend={stats.runs_change >= 0 ? "up" : "down"}
          accent="green"
          delay={0.08}
          icon="▶"
        />
        <StatCard
          label="Success Rate"
          value={`${stats.success_rate}%`}
          sub={`${
            stats.success_rate_change >= 0 ? "↑" : "↓"
          } ${Math.abs(stats.success_rate_change)}% vs yday`}
          trend={stats.success_rate_change >= 0 ? "up" : "down"}
          accent="amber"
          delay={0.12}
          icon="✓"
        />
        <StatCard
          label="Tokens Today"
          value={stats.tokens_today.toLocaleString()}
          sub={`${
            stats.tokens_change >= 0 ? "↑" : "↓"
          } ${Math.abs(stats.tokens_change)}% vs yday`}
          trend={stats.tokens_change >= 0 ? "up" : "down"}
          accent="blue"
          delay={0.16}
          icon="◈"
        />
        <StatCard
          label="Failures"
          value={stats.failures.toLocaleString()}
          sub={`${
            stats.failures_change >= 0 ? "↑" : "↓"
          } ${Math.abs(stats.failures_change)}% vs yday`}
          trend={stats.failures_change > 0 ? "down" : "up"}
          accent="red"
          delay={0.2}
          icon="✕"
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Runs chart */}
        <motion.div
          custom={0.22}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-3"
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Runs · Last 7 days</SectionLabel>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                  <span className="font-mono text-[10px] text-neutral-600">
                    Today
                  </span>
                </div>
                <span className="cursor-pointer font-mono text-[10px] text-green-500 hover:text-green-400 transition-colors">
                  Export ↓
                </span>
              </div>
            </div>
            <WeekChart data={safeChartData} />
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/[0.04] pt-4">
              {[
                {
                  label: "Peak day",
                  value: peakDay ? `${peakDay.day} · ${peakDay.runs}` : "-",
                },
                {
                  label: "Avg / day",
                  value: avgDay.toString(),
                },
                {
                  label: "Week total",
                  value: weekTotal.toString(),
                },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-700">
                    {s.label}
                  </p>
                  <p className="font-mono text-[13px] font-semibold text-neutral-300 mt-0.5">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          custom={0.26}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2"
        >
          <Card className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Recent Activity</SectionLabel>
              <span className="cursor-pointer font-mono text-[10px] text-green-500 hover:text-green-400 transition-colors">
                View all →
              </span>
            </div>

            <div className="space-y-0.5 max-h-[360px] overflow-y-auto pr-1">
              {safeActivities.map((a: any, i) => {
                const meta = activityMeta[
                  a.type as keyof typeof activityMeta
                ] ?? {
                  icon: "📌",
                  className:
                    "border border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
                };

                return (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <div
                      className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-xs ${meta.className}`}
                    >
                      {meta.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-neutral-200 truncate">
                        {a.title}
                      </p>
                      <p className="text-[11px] text-neutral-600 truncate">
                        {a.description}
                      </p>
                    </div>
                    <span className="flex-shrink-0 font-mono text-[10px] text-neutral-700">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Top users quick view */}
      <motion.div
        custom={0.3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Top Users by Runs</SectionLabel>
            <span className="cursor-pointer font-mono text-[10px] text-green-500 hover:text-green-400 transition-colors">
              Manage users →
            </span>
          </div>
          <div className="space-y-2">
            {safeTopUsers.map((u, i) => (
              <div
                key={u.email}
                className="
        flex
        items-center
        justify-between
        rounded-lg
        px-3
        py-2
        hover:bg-white/[0.03]
      "
              >
                <div>
                  <p className="text-sm text-neutral-200">
                    #{i + 1} {u.name}
                  </p>

                  <p className="text-xs text-neutral-600">{u.email}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-green-400">
                    {u.runs}
                  </p>

                  <p className="text-[10px] text-neutral-600">runs</p>
                </div>
              </div>
            ))}
          </div>
          {/* </div>
          <UsersTable rows={USERS.slice(0, 4)} compact /> */}
        </Card>
      </motion.div>
    </motion.div>
  );
}
