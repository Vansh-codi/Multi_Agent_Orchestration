"use client";

import DashboardTabs from "@/components/agentops/DashboardTabs";
import Hero from "@/components/agentops/Hero";
import MaintenancePage from "@/components/agentops/MaintenancePage";
import SettingsPage from "@/components/agentops/SettingsPage";
import Sidebar from "@/components/agentops/Sidebar";
import ToolsPage from "@/components/agentops/toolspage";
import { useAuthStore } from "@/store/authStore";
import MemoryPage from "@/components/agentops/MemoryPage";
import { useEffect, useState } from "react";
export default function DashboardPage() {
  const [activePage, setActivePage] = useState("Dashboard");
  const { user } = useAuthStore();

  useEffect(() => {
    async function syncAuth() {
      if (useAuthStore.getState().isAuthenticated) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          useAuthStore.getState().setAuth(
            {
              id: data.user_id ?? data.id,
              name: data.name ?? "",
              email: data.email,
              role: data.role,
            },
            "session",
          );
        }
      } catch {}
    }
    syncAuth();
  }, []);

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar active={activePage} setActive={setActivePage} user={user} />
      <main className="flex-1 overflow-y-auto">
        {activePage === "Dashboard" && (
          <>
            <Hero />
            <div className="p-6">
              <DashboardTabs />
            </div>
          </>
        )}

        {activePage === "Settings" && <SettingsPage />}

        {activePage === "History" && (
          <div className="p-6 text-zinc-500 text-sm">History — coming soon</div>
        )}
        {activePage === "Orion" && (
          <iframe src="/orion" className="w-full h-screen border-0" />
        )}
        {activePage === "Tools" && <ToolsPage />}

        {activePage === "Memory" && (
  <div className="p-6">
    <MemoryPage /></div>)}
        {activePage === "Maintenance" && <MaintenancePage />}
      </main>
    </div>
  );
}
