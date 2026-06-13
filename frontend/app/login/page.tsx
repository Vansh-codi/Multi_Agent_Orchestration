"use client";

import { useAuthStore } from "@/store/authStore";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const scenes = [
  {
    badge: "AGENTOPS PLATFORM",
    title: ["Autonomous AI", "orchestration for", "modern workflows"],
    description:
      "Planner. Researcher. Coder. Critic. Real-time orchestration with observability, execution pipelines, memory systems, and autonomous multi-agent coordination.",
  },
  {
    badge: "REALTIME OBSERVABILITY",
    title: ["Track every", "agent action", "in realtime"],
    description:
      "Live execution tracing, websocket streaming, orchestration telemetry, infrastructure monitoring, and autonomous workflow visibility.",
  },
  {
    badge: "PERSISTENT MEMORY",
    title: ["Long-term", "memory for", "AI systems"],
    description:
      "Vector retrieval pipelines, adaptive memory, context persistence, and autonomous reasoning layers for orchestration systems.",
  },
  {
    badge: "EXECUTION PIPELINES",
    title: ["Secure", "sandboxed", "execution"],
    description:
      "Docker execution environments, generated files, retry systems, autonomous code execution, and isolated orchestration runtimes.",
  },
];

export default function LoginPage() {
  const [activeScene, setActiveScene] = useState(0);

  // ── Added: auth state ──────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        // IMPORTANT
        credentials: "include",

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail ?? "Invalid credentials");
        return;
      }

      // Backend already sets secure HttpOnly cookie

      setAuth(data.user, data.access_token);

      router.push("/dashboard");
    } catch {
      setError("Server unreachable — is the backend running?");
    } finally {
      setLoading(false);
    }
  }
  // ──────────────────────────────────────────────────────────

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 20 });

  useEffect(() => {
    let locked = false;
    const handleWheel = (e: WheelEvent) => {
      if (locked) return;
      locked = true;
      if (e.deltaY > 0) {
        setActiveScene((prev) => (prev === scenes.length - 1 ? 0 : prev + 1));
      } else {
        setActiveScene((prev) => (prev === 0 ? scenes.length - 1 : prev - 1));
      }
      setTimeout(() => {
        locked = false;
      }, 1200);
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div
      onMouseMove={(e) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }}
      className="relative h-screen overflow-hidden bg-black text-white"
    >
      {/* CURSOR GLOW */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(700px circle at ${smoothX.get()}px ${smoothY.get()}px, rgba(34,197,94,0.14), transparent 42%)`,
        }}
      />

      {/* AURORA */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -20, 30, 0] }}
          transition={{ repeat: Infinity, duration: 12 }}
          className="absolute top-[-220px] right-[-120px] h-[700px] w-[700px] rounded-full bg-green-500/10 blur-[180px]"
        />
        <motion.div
          animate={{ x: [0, -40, 20, 0], y: [0, 20, -20, 0] }}
          transition={{ repeat: Infinity, duration: 15 }}
          className="absolute bottom-[-260px] left-[-120px] h-[700px] w-[700px] rounded-full bg-emerald-500/10 blur-[180px]"
        />
      </div>

      {/* GRID */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* MAIN */}
      <div className="relative z-10 flex h-screen overflow-hidden">
        {/* LEFT PANEL */}
        <div className="relative flex justify-center border-r border-zinc-900">
          <div className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col justify-center px-20 -translate-y-2">
            <motion.div
              initial={{ opacity: 0, x: -50, filter: "blur(12px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8 }}
            >
              {/* LOGO */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="mb-8 flex items-center gap-4"
              >
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 text-xl font-black text-black shadow-[0_0_40px_rgba(34,197,94,0.22)]">
                  <div className="absolute inset-0 rounded-2xl bg-green-400/20 blur-xl" />
                  <span className="relative z-10">A</span>
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-[-0.05em]">
                    AgentOps
                  </h1>
                  <p className="text-xs tracking-wide text-zinc-500">
                    Multi-Agent Control Center
                  </p>
                </div>
              </motion.div>

              {/* BADGE */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-green-400 backdrop-blur-xl"
              >
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                Secure Workspace
              </motion.div>

              {/* TITLE */}
              <motion.h2
                initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.15, duration: 0.8 }}
                className="text-[70px] font-black leading-[0.9] tracking-[-0.07em]"
              >
                Welcome
                <br />
                <span className="text-zinc-300">back</span>
              </motion.h2>

              {/* DESCRIPTION */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 max-w-[420px] text-[17px] leading-8 text-zinc-500"
              >
                Coordinate autonomous agents, execution pipelines, memory
                systems, and realtime orchestration.
              </motion.p>

              {/* FORM — added onSubmit + value/onChange */}
              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <motion.div whileHover={{ scale: 1.01 }} className="relative">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="relative h-16 w-full shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] rounded-3xl border border-zinc-700/80 bg-zinc-950 px-6 text-[15px] text-white outline-none backdrop-blur-2xl transition-all duration-300 placeholder:text-zinc-600 hover:border-green-500/20 focus:border-green-500/40 focus:shadow-[0_0_30px_rgba(34,197,94,0.12)]"
                  />
                </motion.div>

                <motion.div whileHover={{ scale: 1.01 }} className="relative">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="relative h-16 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] w-full rounded-3xl border border-zinc-700/80 bg-zinc-950 px-6 text-[15px] text-white outline-none backdrop-blur-2xl transition-all duration-300 placeholder:text-zinc-600 hover:border-green-500/20 focus:border-green-500/40 focus:shadow-[0_0_30px_rgba(34,197,94,0.12)]"
                  />
                </motion.div>

                {/* ERROR — added */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm px-2"
                  >
                    ✗ {error}
                  </motion.p>
                )}

                {/* BUTTON — added type=submit + disabled + loading */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{
                    scale: loading ? 1 : 1.02,
                    y: loading ? 0 : -2,
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden h-[68px] w-full rounded-3xl bg-green-500 text-lg font-black text-black shadow-[0_0_90px_rgba(34,197,94,0.22)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading && (
                      <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    )}
                    {loading ? "Signing in…" : "Sign In"}
                  </span>
                </motion.button>
              </form>

              {/* GOOGLE LOGIN */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-5"
              >
                <div className="relative flex items-center">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <span className="px-3 text-xs uppercase tracking-[0.2em] text-zinc-600">
                    or
                  </span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>

                <motion.button
                  type="button"
                  onClick={() => {
                    window.location.href = `${API}/auth/google/login`;
                  }}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-3xl border border-zinc-700/80 bg-zinc-950 text-[15px] font-medium text-white transition-all duration-300 hover:border-green-500/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.12)]"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.67-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </motion.button>
              </motion.div>

              {/* FOOTER */}

              {/* FOOTER */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-7 flex items-center justify-between border-t border-green-500/15 pt-5 text-sm"
              >
                <span className="text-green-400/75">
                  Secure encrypted access
                </span>
                <Link
                  href="/signup"
                  className="font-medium text-green-400 transition-all duration-300 hover:text-green-300 hover:drop-shadow-[0_0_10px_rgba(34,197,94,0.35)]"
                >
                  Create account →
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT PANEL — completely unchanged */}
        <div className="relative hidden w-1/2 items-center justify-start overflow-hidden lg:flex">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScene}
              initial={{ opacity: 0, x: -100, filter: "blur(24px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 100, filter: "blur(24px)" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center px-16"
            >
              <div className="max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-5 py-2 text-[11px] uppercase tracking-[0.3em] text-green-400 backdrop-blur-xl"
                >
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  {scenes[activeScene].badge}
                </motion.div>

                <div className="space-y-1">
                  {scenes[activeScene].title.map((line, i) => (
                    <motion.h1
                      key={i}
                      initial={{ opacity: 0, x: -80, filter: "blur(20px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      transition={{ delay: 0.12 * i, duration: 0.8 }}
                      className="text-[64px] xl:text-[72px] font-black leading-[0.9] tracking-[-0.07em] bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent"
                    >
                      {line}
                    </motion.h1>
                  ))}
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="mt-8 max-w-3xl text-[18px] leading-[2] text-zinc-500"
                >
                  {scenes[activeScene].description}
                </motion.p>

                <motion.div
                  animate={{ width: ["0%", "100%", "45%"] }}
                  transition={{ duration: 2 }}
                  className="mt-8 mb-10 h-[1px] bg-gradient-to-r from-green-500 to-transparent"
                />

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-2 gap-5"
                >
                  {[
                    {
                      tag: "REALTIME",
                      title: "Observability",
                      desc: "Live orchestration logs and execution tracing.",
                    },
                    {
                      tag: "MEMORY",
                      title: "Persistent Context",
                      desc: "Long-term adaptive memory pipelines.",
                    },
                  ].map((card) => (
                    <motion.div
                      key={card.title}
                      whileHover={{ y: -6, scale: 1.02 }}
                      className="group rounded-[30px] border border-green-500/20 bg-black/40 p-7 backdrop-blur-2xl transition-all hover:border-green-400 hover:shadow-[0_0_50px_rgba(34,197,94,0.12)]"
                    >
                      <div className="mb-4 text-xs text-green-400">
                        {card.tag}
                      </div>
                      <h3 className="mb-4 text-2xl font-bold transition-all group-hover:text-green-300">
                        {card.title}
                      </h3>
                      <p className="text-base leading-8 text-zinc-500">
                        {card.desc}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* SCROLL */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="fixed bottom-8 right-10 z-50 text-sm uppercase tracking-[0.3em] text-green-400/70"
      >
        Scroll
      </motion.div>
    </div>
  );
}
