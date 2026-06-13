// ═══════════════════════════════════════════════════════════════
//  PANEL: USERS
// ═══════════════════════════════════════════════════════════════
import { motion } from "framer-motion";

import { useEffect, useState } from "react";
import Card from "../AdminCard";
// import { USERS } from "../adminData";

import { apiFetch } from "@/lib/api";
import UsersTable from "../AdminTable";
import { PlanType, UserStatus } from "../adminTypes";
import { fadeUp, panelAnim } from "../animation";

import StatCard from "../AdminStats";
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}
export default function UsersPanel() {
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "All">("All");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const totalUsers = users.length;

  const adminUsers = users.filter((u) => u.role === "admin").length;

  const normalUsers = users.filter((u) => u.role === "user").length;
  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(
      query.toLowerCase(),
      // u.email.toLowerCase().includes(query.toLowerCase()) &&
      // (planFilter === "All" || u.plan === planFilter) &&
      // (statusFilter === "All" || u.status === statusFilter),
    ),
  );
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/admin/users");
        setUsers(await res.json());
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
      key="users"
      variants={panelAnim}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-4"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Users"
          value={totalUsers.toString()}
          sub="All time"
          accent="green"
          delay={0}
        />
        <StatCard
          label="Pro Plan"
          value={adminUsers.toString()}
          sub="38% of users"
          accent="blue"
          delay={0.04}
        />
        <StatCard
          label="Team Plan"
          value={normalUsers.toString()}
          sub="24% of users"
          accent="amber"
          delay={0.08}
        />
        <StatCard
          label="Suspended"
          value="0"
          sub="1.8% of users"
          accent="red"
          delay={0.12}
        />
      </div>

      {/* Toolbar */}
      <motion.div
        custom={0.16}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by email…"
                className="h-8 w-56 rounded-lg border border-white/[0.08] bg-white/[0.04] pl-8 pr-3 font-mono text-[11px] text-neutral-300 placeholder-neutral-600 outline-none transition-all focus:border-green-500/40 focus:ring-1 focus:ring-green-500/10"
              />
            </div>

            {/* Plan filter */}
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-0.5">
              {(["All", "Pro", "Team", "Free"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlanFilter(p as PlanType | "All")}
                  className={`rounded-md px-2.5 py-1 font-mono text-[10px] transition-all
                    ${
                      planFilter === p
                        ? "bg-white/[0.08] text-neutral-200"
                        : "text-neutral-600 hover:text-neutral-400"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-0.5">
              {(["All", "Active", "Idle", "Suspended"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as UserStatus | "All")}
                  className={`rounded-md px-2.5 py-1 font-mono text-[10px] transition-all
                    ${
                      statusFilter === s
                        ? "bg-white/[0.08] text-neutral-200"
                        : "text-neutral-600 hover:text-neutral-400"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <button className="flex h-8 items-center gap-1.5 rounded-lg border border-green-500/25 bg-green-500/10 px-3 font-mono text-[11px] text-green-400 transition-all hover:bg-green-500/20">
              + Invite User
            </button>
            <button className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 font-mono text-[11px] text-neutral-500 transition-all hover:text-neutral-300">
              ↓ Export CSV
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div
        custom={0.2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card className="p-4">
          <UsersTable rows={filtered} />
          <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3">
            <span className="font-mono text-[11px] text-neutral-700">
              Showing {filtered.length} of {users.length} users
            </span>
            <div className="flex items-center gap-1">
              {["‹", "1", "2", "3", "…", "43", "›"].map((p, i) => (
                <button
                  key={i}
                  className={`flex h-7 min-w-[28px] items-center justify-center rounded-md border font-mono text-[10px] px-2 transition-all
                    ${
                      p === "1"
                        ? "border-green-500/25 bg-green-500/10 text-green-400"
                        : "border-white/[0.05] bg-white/[0.02] text-neutral-600 hover:border-white/[0.1] hover:text-neutral-400"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
