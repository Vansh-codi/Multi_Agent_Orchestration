"use client";

import { useAuthStore } from "@/store/authStore";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function SignupPage() {
  // ── Added: state ──────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        // IMPORTANT
        credentials: "include",

        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail ?? "Signup failed");
        return;
      }

      // DO NOT STORE JWT IN FRONTEND
      // Cookie is already securely stored by backend

      setAuth(data.user, data.access_token);

      router.push("/dashboard");
    } catch {
      setError("Server unreachable — is the backend running?");
    } finally {
      setLoading(false);
    }
  }
  // ─────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-220px] top-[120px] h-[480px] w-[480px] rounded-full bg-green-500/10 blur-[160px]" />
        <div className="absolute right-[-260px] top-[-120px] h-[720px] w-[720px] rounded-full bg-emerald-500/10 blur-[200px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,black_80%)]" />
      </div>

      {/* MAIN */}
      <div className="relative z-10 flex min-h-screen">
        {/* LEFT PANEL */}
        <div className="relative flex w-full items-start pt-20 justify-center border-r border-zinc-900 lg:w-[42%]">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/[0.015] to-green-500/[0.03]" />

          <div className="relative z-10 w-full max-w-[560px] px-14">
            {/* BADGE */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-5 py-2 text-[11px] uppercase tracking-[0.28em] text-green-400 backdrop-blur-xl"
            >
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Join AgentOps
            </motion.div>

            {/* HEADING */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8 text-[62px] font-black leading-[0.9] tracking-[-0.08em]"
            >
              Build
              <br />
              autonomous
              <br />
              workflows
            </motion.h1>

            {/* SUBTEXT */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 max-w-[460px] text-[18px] leading-8 text-zinc-500"
            >
              Create your workspace and start orchestrating intelligent
              multi-agent systems with realtime execution and adaptive memory.
            </motion.p>

            {/* FORM — added onSubmit */}
            <form onSubmit={handleSignup} className="mt-9 space-y-5">
              {/* FULL NAME */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="group relative"
              >
                <div className="absolute inset-0 rounded-3xl bg-green-500/0 blur-xl transition-all duration-500 group-hover:bg-green-500/10" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="relative h-16 w-full rounded-3xl border border-zinc-800 bg-black/60 px-6 text-[15px] text-white outline-none backdrop-blur-2xl transition-all duration-300 placeholder:text-zinc-600 hover:border-green-500/20 focus:border-green-500/40 focus:shadow-[0_0_35px_rgba(34,197,94,0.10)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                />
              </motion.div>

              {/* EMAIL */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="group relative"
              >
                <div className="absolute inset-0 rounded-3xl bg-green-500/0 blur-xl transition-all duration-500 group-hover:bg-green-500/10" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="relative h-16 w-full rounded-3xl border border-zinc-800 bg-black/60 px-6 text-[15px] text-white outline-none backdrop-blur-2xl transition-all duration-300 placeholder:text-zinc-600 hover:border-green-500/20 focus:border-green-500/40 focus:shadow-[0_0_35px_rgba(34,197,94,0.10)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                />
              </motion.div>

              {/* PASSWORD */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="group relative"
              >
                <div className="absolute inset-0 rounded-3xl bg-green-500/0 blur-xl transition-all duration-500 group-hover:bg-green-500/10" />
                <input
                  type="password"
                  placeholder="Password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="relative h-16 w-full rounded-3xl border border-zinc-800 bg-black/60 px-6 text-[15px] text-white outline-none backdrop-blur-2xl transition-all duration-300 placeholder:text-zinc-600 hover:border-green-500/20 focus:border-green-500/40 focus:shadow-[0_0_35px_rgba(34,197,94,0.10)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                />
              </motion.div>

              {/* ERROR */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm px-2"
                >
                  ✗ {error}
                </motion.p>
              )}

              {/* BUTTON */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative h-[70px] w-full overflow-hidden rounded-3xl bg-green-500 text-lg font-black text-black shadow-[0_0_90px_rgba(34,197,94,0.22)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading && (
                    <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  )}
                  {loading ? "Creating workspace…" : "Create Workspace"}
                </span>
              </motion.button>
            </form>

            {/* FOOTER */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex items-center justify-between border-t border-white/[0.04] pt-5 text-[13px]"
            >
              <span className="text-green-400/90">
                Workspace provisioning enabled
              </span>
              <Link
                href="/login"
                className="text-green-400 transition-all hover:text-green-300"
              >
                Sign in →
              </Link>
            </motion.div>
          </div>
        </div>

        {/* RIGHT PANEL — unchanged from your original */}
        <div className="relative hidden flex-1 overflow-hidden lg:flex">
          <div className="absolute right-[-180px] top-[-60px] h-[760px] w-[760px] rounded-full bg-green-500/10 blur-[180px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-green-500/[0.015] to-green-500/[0.04]" />

          <div className="absolute right-0 top-0 hidden h-full w-[54px] overflow-hidden border-l border-green-500/15 bg-black/30 xl:flex items-center justify-center">
            <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-green-400/40 to-transparent" />
            <div className="absolute inset-0 opacity-[0.04] bg-[repeating-linear-gradient(45deg,#22c55e,#22c55e_2px,transparent_2px,transparent_12px)]" />
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{ y: ["0%", "-50%"] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute left-1/2 top-0 flex -translate-x-1/2 flex-col gap-14"
              >
                {[...Array(2)].map((_, si) =>
                  [
                    "Agent telemetry",
                    "Realtime orchestration",
                    "Execution pipeline",
                    "Persistent memory",
                    "Adaptive coordination",
                  ].map((item, i) => (
                    <span
                      key={`${si}-${i}`}
                      className="rotate-180 text-[8px] font-medium uppercase tracking-[0.34em] text-green-400/75 [writing-mode:vertical-rl]"
                    >
                      {item}
                    </span>
                  )),
                )}
              </motion.div>
            </div>
          </div>

          <div className="relative z-10 flex w-full items-center pl-28 pr-32">
            <div className="max-w-[620px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-5 py-2 text-[11px] uppercase tracking-[0.28em] text-green-400 backdrop-blur-xl">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                Platform Access
              </div>
              <h2 className="mt-8 max-w-[760px] text-[72px] font-black leading-[0.9] tracking-[-0.08em]">
                Coordinate
                <br />
                intelligent
                <br />
                workflows
              </h2>
              <p className="mt-8 max-w-[700px] text-[20px] leading-10 text-zinc-500">
                Realtime orchestration with execution pipelines, persistent
                memory, observability, and adaptive multi-agent coordination.
              </p>
              <div className="mt-10 h-px w-[280px] bg-green-500/20" />
              <div className="mt-10 space-y-7">
                {[
                  "Realtime orchestration",
                  "Persistent memory pipelines",
                  "Autonomous execution tracing",
                  "Multi-agent coordination",
                ].map((item) => (
                  <motion.div
                    key={item}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-4"
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-green-400" />
                      <div className="absolute h-4 w-4 rounded-full bg-green-400/20 blur-sm" />
                    </div>
                    <span className="text-[18px] text-zinc-300">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
