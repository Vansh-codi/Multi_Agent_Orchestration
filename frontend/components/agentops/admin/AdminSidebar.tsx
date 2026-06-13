"use client";

import { motion } from "framer-motion";
import Link from "next/link";

function NavItem({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-[13px] transition-all
        ${
          active
            ? "border-white/[0.08] bg-white/[0.04] text-white"
            : "border-transparent text-neutral-600 hover:border-white/[0.05] hover:bg-white/[0.03] hover:text-neutral-400"
        }`}
    >
      <span
        className={`w-4 text-center text-sm leading-none flex-shrink-0
        ${
          active
            ? "text-green-400"
            : "text-neutral-700 group-hover:text-neutral-500"
        }`}
      >
        {icon}
      </span>

      <span className="flex-1 truncate font-medium">{label}</span>

      {badge && (
        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 font-mono text-[9px] text-red-400">
          {badge}
        </span>
      )}
    </Link>
  );
}

interface AdminSidebarProps {
  user: any;
  logout: () => void;
}

export default function AdminSidebar({ user, logout }: AdminSidebarProps) {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative z-10 flex w-52 flex-shrink-0 flex-col border-r border-white/[0.06] bg-[#070707]"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-[15px]">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-green-500 font-mono text-[13px] font-bold text-black">
          A
        </div>

        <div>
          <p className="text-[14px] font-semibold tracking-tight text-white leading-none">
            AgentOps
          </p>

          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-neutral-700">
            Control Center
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
        <NavItem href="/dashboard" icon="⊞" label="Dashboard" />

        <NavItem href="/history" icon="◷" label="History" />

        <NavItem href="/agents" icon="◈" label="Agents" />

        <NavItem href="/tools" icon="⚙" label="Tools" />

        <NavItem href="/memory" icon="◉" label="Memory" />

        <NavItem href="/settings" icon="≡" label="Settings" />

        <div className="my-3 border-t border-white/[0.04]" />

        <p className="mb-1 px-2.5 font-mono text-[9px] uppercase tracking-[0.15em] text-neutral-700">
          Admin
        </p>

        <NavItem
          href="/admin"
          icon="⬡"
          label="Admin Panel"
          active
          badge="ADMIN"
        />
      </nav>

      {/* User */}
      <div className="border-t border-white/[0.06] p-2.5 space-y-1">
        <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-white/[0.03] transition-colors cursor-pointer group">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-green-500/10 font-mono text-[11px] font-semibold text-green-400">
            {user?.email?.slice(0, 2).toUpperCase() ?? "AD"}
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate text-[11px] font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors">
              {user?.email ?? "admin@agentops.ai"}
            </p>

            <p className="font-mono text-[9px] text-neutral-700">role: admin</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full rounded-lg px-2.5 py-1.5 text-left font-mono text-[10px] text-neutral-700 transition-colors hover:text-red-400"
        >
          Sign out →
        </button>
      </div>
    </motion.aside>
  );
}
