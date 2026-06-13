"use client";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Tab } from "./adminTypes";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

import OverviewPanel from "./panels/OverviewPanel";
import RunsPanel from "./panels/RunsPanel";
import SystemPanel from "./panels/SystemPanel";
import UsersPanel from "./panels/UsersPanel";

import { ADMIN_TABS } from "./adminData";
export default function AdminDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const { user, logout } = useAuthStore();

  const [tab, setTab] = useState<Tab>("overview");

  // Optional auth guard
  /*
  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
  }, [user, router]);
  */

  // Ambient cursor glow
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
    apiFetch("/admin/me")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (res.status === 403) {
          router.replace("/dashboard");
          return;
        }

        setChecking(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
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
      className="relative flex min-h-screen overflow-hidden bg-[#0b0d0f]"
      style={{
        fontFamily: "'Outfit', 'JetBrains Mono', system-ui, sans-serif",
      }}
    >
      {/* Ambient Glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(
          500px circle at ${sx}px ${sy}px,
          rgba(255,255,255,0.01)
          transparent 70%
        )`,
        }}
      />

      <AdminSidebar user={user} logout={logout} />

      <div className="relative z-10 flex flex-1 flex-col min-w-0">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: 0.12,
            }}
            className="mb-5 flex w-fit items-center rounded-xl border border-white/[0.04] bg-[#0c0c0c] p-1 gap-0.5"
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
                    className="absolute inset-0 rounded-lg border border-white/[0.08] bg-white/[0.04]"
                    // className="absolute inset-0 rounded-lg border border-green-500/20 bg-green-500/[0.1]"
                  />
                )}

                <span className="relative">{t.label}</span>
              </button>
            ))}
          </motion.div>

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
