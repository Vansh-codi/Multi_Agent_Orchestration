"use client";
import type { User } from "@/store/authStore";
import {
  Bot,
  Database,
  History,
  LayoutDashboard,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const items = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "History", icon: History },
  { label: "Agents", icon: Bot },
  { label: "Tools", icon: Wrench },
  { label: "Memory", icon: Database },
  { label: "Settings", icon: Settings },
  { label: "Maintenance", icon: Newspaper },
];

interface Props {
  active: string;
  setActive: (value: string) => void;
  user: User | null;
}

export default function Sidebar({ active, setActive, user }: Props) {
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
      relative
      ${collapsed ? "w-20" : "w-64"}
      flex
      flex-col
      border-r
      border-zinc-800/80
      bg-zinc-950/70
      backdrop-blur-2xl
      transition-all
      duration-300
      overflow-hidden

      before:absolute
      before:top-0
      before:right-0
      before:h-full
      before:w-px
      before:bg-gradient-to-b
      before:from-transparent
      before:via-green-500/10
      before:to-transparent
    `}
    >
      {/* HEADER */}
      <div className="border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          {!collapsed && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                AgentOps
              </h1>

              <p className="text-xs text-zinc-500 mt-2">AI Control Center</p>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="
        h-8
        w-8
        flex
        items-center
        justify-center
        rounded-lg
        text-zinc-500
        hover:text-white
        hover:bg-zinc-800/60
        transition-all
      "
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </button>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          const isActive = active === item.label;

          return (
            <button
              key={item.label}
              title={collapsed ? item.label : ""}
              onClick={() => setActive(item.label)}
              className={`
                w-full
                flex
                items-center
                ${collapsed ? "justify-center" : "gap-3"}
                rounded-xl
                px-3
                py-3
                border
                text-left
                transition-all

                ${
                  isActive
                    ? `
                    bg-gradient-to-r
from-green-500/10
to-emerald-500/5
border-green-500/20
text-green-400
shadow-[0_0_18px_rgba(34,197,94,0.06)]
                    `
                    : `
                      border-transparent
                      text-zinc-300
                      hover:bg-zinc-800/50
hover:border-zinc-700
                      hover:text-white
                    `
                }
              `}
            >
              <Icon size={18} />

              {!collapsed && (
                <span className="font-medium text-[15px]">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ADMIN */}
      {user?.role === "admin" && (
        <div className="p-3 border-t border-zinc-800">
          <button
            title={collapsed ? "Admin" : ""}
            onClick={() => router.push("/admin")}
            className="
        w-full
        flex
        items-center
        justify-center
        gap-3
        rounded-xl
        px-3
        py-2
        border
        border-green-500/30
        bg-green-500/10
        text-green-400
        hover:bg-green-500/15
        transition-all
      "
          >
            <Shield size={18} />

            {!collapsed && <span className="text-sm font-medium">Admin</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
