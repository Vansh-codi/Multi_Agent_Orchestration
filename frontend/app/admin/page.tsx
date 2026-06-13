"use client";

import { ADMIN_TABS } from "@/components/agentops/admin/adminData";
import AdminHeader from "@/components/agentops/admin/AdminHeader";
import AdminSidebar from "@/components/agentops/admin/AdminSidebar";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import OverviewPanel from "@/components/agentops/admin/panels/OverviewPanel";
import RunsPanel from "@/components/agentops/admin/panels/RunsPanel";
import SystemPanel from "@/components/agentops/admin/panels/SystemPanel";
import UsersPanel from "@/components/agentops/admin/panels/UsersPanel";

import { Tab } from "@/components/agentops/admin/adminTypes";

export default function AdminDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    apiFetch("/admin/me")
      .then((res) => {
        if (res.status === 403) {
          router.replace("/dashboard");
          return;
        }

        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);
  const { user, logout } = useAuthStore();

  const [tab, setTab] = useState<Tab>("overview");

  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);

  const sx = useSpring(mx, {
    stiffness: 100,
    damping: 25,
  });

  const sy = useSpring(my, {
    stiffness: 100,
    damping: 25,
  });

  useEffect(() => {
    const h = (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };

    window.addEventListener("mousemove", h);

    return () => {
      window.removeEventListener("mousemove", h);
    };
  }, [mx, my]);
  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        Checking permissions...
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen overflow-hidden bg-[#050505]"
      style={{
        fontFamily: "'Outfit', 'JetBrains Mono', system-ui, sans-serif",
      }}
    >
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(
            500px circle at ${sx}px ${sy}px,
            rgba(255,255,255,0.02),
            transparent 70%
          )`,
        }}
      />

      <AdminSidebar user={user} logout={logout} />
      <div className="flex-1 relative z-10">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: 0.12,
            }}
            className="mb-5 flex w-fit items-center rounded-xl border border-white/[0.06] bg-[#0d140d] p-1 gap-0.5"
          >
            {ADMIN_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative rounded-lg px-4 py-1.5 font-mono text-[11px] font-medium tracking-wide transition-all ${
                  tab === t.key
                    ? "text-white"
                    : "text-neutral-600 hover:text-neutral-400"
                }`}
              >
                {tab === t.key && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-lg border border-green-500/20 bg-green-500/[0.1]"
                  />
                )}

                <span className="relative">{t.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Panels */}
          <AnimatePresence mode="wait">
            {tab === "overview" && <OverviewPanel />}
            {tab === "users" && <UsersPanel />}
            {tab === "runs" && <RunsPanel />}
            {tab === "system" && <SystemPanel />}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
