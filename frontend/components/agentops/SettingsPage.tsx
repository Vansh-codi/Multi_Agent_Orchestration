"use client";
import { useAuthStore } from "@/store/authStore";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const TABS = ["Profile", "Plan", "API Keys", "Preferences"];
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function WaterCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);
    const cols = Math.ceil(W / 28);
    const rows = Math.ceil(H / 28);
    const grid: number[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(0),
    );
    const prev: number[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(0),
    );

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const cx = Math.floor(mouseRef.current.x / 28);
      const cy = Math.floor(mouseRef.current.y / 28);
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++)
          if (cy + dy >= 0 && cy + dy < rows && cx + dx >= 0 && cx + dx < cols)
            grid[cy + dy][cx + dx] +=
              80 * (1 - Math.sqrt(dx * dx + dy * dy) / 3);
    };
    canvas.addEventListener("mousemove", onMove);

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      for (let r = 1; r < rows - 1; r++)
        for (let c = 1; c < cols - 1; c++) {
          const next =
            (grid[r - 1][c] +
              grid[r + 1][c] +
              grid[r][c - 1] +
              grid[r][c + 1]) /
              2 -
            prev[r][c];
          prev[r][c] = next * 0.97;
        }
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) grid[r][c] = prev[r][c];
      for (let r = 1; r < rows - 1; r++)
        for (let c = 1; c < cols - 1; c++) {
          const v = Math.abs(grid[r][c]);
          if (v < 0.5) continue;
          ctx.beginPath();
          ctx.arc(c * 28, r * 28, Math.min(v / 20 + 1, 6), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(74, 222, 128, ${Math.min(v / 60, 0.35)})`;
          ctx.fill();
        }
      animRef.current = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

function TorchCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.closest(".settings-shell") as HTMLElement;
    if (!parent) return;
    const move = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      el.style.left = `${e.clientX - rect.left}px`;
      el.style.top = `${e.clientY - rect.top}px`;
    };
    parent.addEventListener("mousemove", move);
    return () => parent.removeEventListener("mousemove", move);
  }, []);
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute z-0"
      style={{
        width: 340,
        height: 340,
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        background:
          "radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)",
        transition: "left 0.08s, top 0.08s",
      }}
    />
  );
}

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative flex-shrink-0 transition-all duration-300"
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: on ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.08)",
        border: on
          ? "1px solid rgba(74,222,128,0.5)"
          : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span
        className="absolute top-0.5 transition-all duration-300"
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: on ? "#000" : "rgba(255,255,255,0.4)",
          left: on ? 22 : 2,
          boxShadow: on ? "0 0 8px rgba(74,222,128,0.6)" : "none",
        }}
      />
    </button>
  );
}

function StatusMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  const isError = [
    "error",
    "incorrect",
    "short",
    "fill",
    "network",
    "uppercase",
    "lowercase",
    "number",
  ].some((w) => msg.toLowerCase().includes(w));
  return (
    <p
      style={{
        fontSize: 12,
        marginTop: 10,
        color: isError ? "#f87171" : "#4ade80",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 14 }}>{isError ? "✗" : "✓"}</span> {msg}
    </p>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [prefs, setPrefs] = useState({
    webSearch: true,
    caching: false,
    smartSuggestion: true,
  });
  const [ragVal, setRagVal] = useState(1.5);
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [apiKeys, setApiKeys] = useState({
    groq_key: "",
    serpapi_key: "",
    github_token: "",
  });
  const { user, updateUser } = useAuthStore();

  // Profile
  const [name, setName] = useState(user?.name ?? "");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [stats, setStats] = useState({
    runs_today: 0,
    runs_limit: 40,
    files_uploaded: 0,
    files_limit: 10,
    tokens_used: 0,
    tokens_limit: 100000,
  });

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/plan/stats`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        console.log("PLAN STATS", data);
        setStats(data);
      })
      .catch((err) => {
        console.error("PLAN STATS ERROR", err);
      });
  }, []);
  useEffect(() => {
    fetch(`${API}/apikeys`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then(setApiKeys)
      .catch(console.error);
  }, []);
  useEffect(() => {
    fetch(`${API}/preferences`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.preferences) return;

        setModel(data.preferences.model);

        setPrefs({
          webSearch: data.preferences.web_search,
          caching: data.preferences.smart_cache,
          smartSuggestion: data.preferences.smart_suggestion,
        });

        setRagVal(data.preferences.rag_threshold);
      })
      .catch(console.error);
  }, []);

  const savePreferences = async () => {
    const res = await fetch(`${API}/preferences`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        web_search: prefs.webSearch,
        smart_cache: prefs.caching,
        smart_suggestion: prefs.smartSuggestion,
        rag_threshold: ragVal,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Preferences saved");
    } else {
      alert(data.detail || "Failed to save preferences");
    }
  };
  // ── Save profile ──────────────────────────────────────────
  const saveProfile = async () => {
    if (!name.trim()) return;
    setProfileLoading(true);
    setProfileMsg("");
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg("Profile saved");
        updateUser({ name: data.name });
      } else {
        setProfileMsg(data.detail ?? "Error saving profile");
      }
    } catch {
      setProfileMsg("Network error");
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Change password ───────────────────────────────────────
  const changePassword = async () => {
    if (!currentPw || !newPw) {
      setPwMsg("Fill both fields");
      return;
    }
    setPwLoading(true);
    setPwMsg("");
    try {
      const res = await fetch(`${API}/auth/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          current_password: currentPw,
          new_password: newPw,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg("Password updated — signing out...");
        setCurrentPw("");
        setNewPw("");
        // Force logout after password change
        setTimeout(async () => {
          await fetch(`${API}/auth/logout`, {
            method: "POST",
            credentials: "include",
          });
          useAuthStore.getState().logout();
          window.location.href = "/login";
        }, 1500);
      } else {
        setPwMsg(data.detail ?? "Error");
      }
    } catch {
      setPwMsg("Network error");
    } finally {
      setPwLoading(false);
    }
  };
  const saveKeys = async () => {
    const res = await fetch(`${API}/apikeys`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiKeys),
    });

    if (res.ok) {
      alert("Keys saved");
    } else {
      alert("Failed to save keys");
    }
  };
  const testGroq = async () => {
    const res = await fetch(`${API}/apikeys/test/groq`, {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      alert(" Groq API key is valid");
    } else {
      alert(` ${data.error}`);
    }
  };
  const deleteAllKeys = async () => {
    const res = await fetch(`${API}/apikeys`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        groq_key: "",
        serpapi_key: "",
        github_token: "",
      }),
    });

    if (res.ok) {
      setApiKeys({
        groq_key: "",
        serpapi_key: "",
        github_token: "",
      });

      alert("All keys deleted");
    } else {
      alert("Failed to delete keys");
    }
  };

  // ── Delete account ────────────────────────────────────────
  const deleteAccount = async () => {
    if (
      !confirm(
        "This cannot be undone. Your account and all data will be permanently deleted.",
      )
    )
      return;
    try {
      await fetch(`${API}/auth/account`, {
        method: "DELETE",
        credentials: "include",
      });
      useAuthStore.getState().logout();
      window.location.href = "/login";
    } catch {
      alert("Error deleting account. Try again.");
    }
  };

  // ── Sign out ──────────────────────────────────────────────
  const signOut = async () => {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    useAuthStore.getState().logout();
    window.location.href = "/login";
  };

  return (
    <div className="settings-shell relative min-h-screen bg-zinc-950">
      <TorchCursor />

      {/* RIGHT SIDE MOTION STRIP */}
      <div className="absolute right-0 top-0 hidden h-full w-[54px] overflow-hidden border-l border-green-500/15 bg-black/30 xl:flex items-center justify-center z-20">
        <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-green-400/40 to-transparent" />

        <div className="absolute inset-0 opacity-[0.04] bg-[repeating-linear-gradient(45deg,#22c55e,#22c55e_2px,transparent_2px,transparent_12px)]" />

        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ y: ["10%", "-30%"] }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute left-1/2 top-0 flex -translate-x-1/2 flex-col gap-14"
          >
            {[...Array(2)].map((_, si) =>
              [
                "BETA VERSION",
                "UNDER ANALYSIS",
                "BUG TESTING",
                "SUPPORT",
                "CONTACT",
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

      {/* Existing content */}

      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(74,222,128,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: -120,
          right: -120,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: -80,
          left: -80,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(74,222,128,0.04) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* ── Header with visible sign out ── */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 3,
                  height: 28,
                  background:
                    "linear-gradient(to bottom, #4ade80, transparent)",
                  borderRadius: 2,
                }}
              />
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "#f0fdf4",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                Settings
              </h1>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.3)",
                paddingLeft: 15,
              }}
            >
              Configure your workspace
            </p>
          </div>

          {/* Sign out — clearly visible */}
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              color: "#f87171",
              boxShadow: "0 0 12px rgba(248,113,113,0.1)",
              marginTop: 4,
            }}
          >
            <span>→</span>
            <span>Sign Out</span>
          </button>
        </div>

        {/* ── User summary bar ── */}
        <div
          className="flex items-center gap-4 px-5 py-4 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            className="flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(74,222,128,0.1)",
              border: "1px solid rgba(74,222,128,0.3)",
              color: "#4ade80",
              boxShadow: "0 0 14px rgba(74,222,128,0.15)",
            }}
          >
            {name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontWeight: 600, fontSize: 15, color: "#f0fdf4" }}>
              {name || user?.name || "User"}
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              {user?.email ?? "—"}
            </p>
          </div>
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.1em",
              color: "#4ade80",
              background: "rgba(74,222,128,0.08)",
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid rgba(74,222,128,0.2)",
              flexShrink: 0,
            }}
          >
            FREE PLAN
          </span>
        </div>

        {/* ── Tab bar ── */}
        <div
          className="flex gap-1 p-1 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200"
              style={{
                background:
                  activeTab === tab ? "rgba(74,222,128,0.12)" : "transparent",
                color: activeTab === tab ? "#4ade80" : "rgba(255,255,255,0.3)",
                border:
                  activeTab === tab
                    ? "1px solid rgba(74,222,128,0.2)"
                    : "1px solid transparent",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── PROFILE ── */}
        {activeTab === "Profile" && (
          <div className="space-y-4">
            <div
              className="relative overflow-hidden rounded-3xl p-6"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(74,222,128,0.12)",
              }}
            >
              <WaterCanvas />
              <div className="relative z-10 space-y-4">
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    color: "rgba(74,222,128,0.6)",
                    textTransform: "uppercase",
                  }}
                >
                  Profile Information
                </p>
                <div className="space-y-1.5">
                  <label
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                    }}
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(74,222,128,0.2)",
                      color: "#f0fdf4",
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email ?? ""}
                    disabled
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.2)",
                    }}
                  />
                </div>
                <button
                  onClick={saveProfile}
                  disabled={profileLoading}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: profileLoading
                      ? "rgba(74,222,128,0.4)"
                      : "rgba(74,222,128,0.9)",
                    color: "#000",
                    boxShadow: "0 0 14px rgba(74,222,128,0.3)",
                  }}
                >
                  {profileLoading ? "Saving..." : "Save Changes"}
                </button>
                <StatusMsg msg={profileMsg} />
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-3xl p-6"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(56,189,248,0.12)",
              }}
            >
              <WaterCanvas />
              <div className="relative z-10 space-y-4">
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    color: "rgba(56,189,248,0.6)",
                    textTransform: "uppercase",
                  }}
                >
                  Change Password
                </p>
                <div className="space-y-1.5">
                  <label
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                    }}
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(56,189,248,0.2)",
                      color: "#f0fdf4",
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                    }}
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(56,189,248,0.2)",
                      color: "#f0fdf4",
                    }}
                  />
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                    Min 8 chars · uppercase · lowercase · number
                  </p>
                </div>
                <button
                  onClick={changePassword}
                  disabled={pwLoading}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: pwLoading
                      ? "rgba(56,189,248,0.2)"
                      : "rgba(56,189,248,0.1)",
                    border: "1px solid rgba(56,189,248,0.3)",
                    color: "#38bdf8",
                    boxShadow: "0 0 12px rgba(56,189,248,0.15)",
                  }}
                >
                  {pwLoading ? "Updating..." : "Update Password"}
                </button>
                <StatusMsg msg={pwMsg} />
              </div>
            </div>

            <div
              className="rounded-3xl p-6 space-y-3"
              style={{
                background: "rgba(239,68,68,0.04)",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: "rgba(239,68,68,0.6)",
                  textTransform: "uppercase",
                }}
              >
                Danger Zone
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                Permanently delete your account and all associated data. This
                cannot be undone.
              </p>
              <button
                onClick={deleteAccount}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                  boxShadow: "0 0 12px rgba(239,68,68,0.1)",
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* ── PLAN ── */}
        {activeTab === "Plan" && (
          <div className="space-y-4">
            <div
              className="rounded-3xl p-6 space-y-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: "rgba(74,222,128,0.6)",
                  textTransform: "uppercase",
                }}
              >
                This Month
              </p>
              {[
                {
                  label: "Runs today",
                  used: stats.runs_today,
                  total: stats.runs_limit,
                  color: "#4ade80",
                },
                {
                  label: "Tokens used",
                  used: stats.tokens_used ?? 0,
                  total: stats.tokens_limit ?? 100000,
                  color: "#38bdf8",
                },
                {
                  label: "Files uploaded",
                  used: stats.files_uploaded ?? 0,
                  total: stats.files_limit ?? 10,
                  color: "#fb923c",
                },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between mb-1.5">
                    <span
                      style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}
                    >
                      {s.label}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.6)",
                        fontFamily: "monospace",
                      }}
                    >
                      {(s.used ?? 0).toLocaleString()} /{" "}
                      {(s.total ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 99,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(s.used / s.total) * 100}%`,
                        background: s.color,
                        borderRadius: 99,
                        boxShadow: `0 0 8px ${s.color}60`,
                        transition: "width 0.6s",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  name: "Free",
                  price: "$0",
                  sub: "forever",
                  features: ["10 runs/day", "1 file", "Basic RAG"],
                  current: true,
                  color: "rgba(255,255,255,0.06)",
                  accent: "rgba(255,255,255,0.2)",
                },
                {
                  name: "Pro",
                  price: "$19",
                  sub: "/month",
                  features: [
                    "Unlimited runs",
                    "10 files",
                    "Web search",
                    "History & Replay",
                  ],
                  highlight: true,
                  color: "rgba(74,222,128,0.08)",
                  accent: "#4ade80",
                },
                {
                  name: "Team",
                  price: "$49",
                  sub: "/month",
                  features: [
                    "Everything in Pro",
                    "5 members",
                    "Shared memory",
                    "API access",
                  ],
                  color: "rgba(56,189,248,0.06)",
                  accent: "#38bdf8",
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className="rounded-3xl p-5 space-y-4 relative overflow-hidden"
                  style={{
                    background: plan.color,
                    border: `1px solid ${plan.accent}40`,
                  }}
                >
                  {plan.highlight && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        background: "rgba(74,222,128,0.15)",
                        color: "#4ade80",
                        padding: "3px 8px",
                        borderRadius: 4,
                        border: "1px solid rgba(74,222,128,0.2)",
                      }}
                    >
                      UNDER DEVELOPMENT
                    </div>
                  )}
                  <div>
                    <p
                      style={{
                        fontSize: 12,
                        color: plan.accent,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {plan.name}
                    </p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: "#f0fdf4",
                          fontFamily: "monospace",
                        }}
                      >
                        {plan.price}
                      </span>
                      <span
                        style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}
                      >
                        {plan.sub}
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2 items-start">
                        <span
                          style={{
                            color: plan.accent,
                            fontSize: 14,
                            marginTop: 1,
                          }}
                        >
                          ✓
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={plan.current}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: plan.current
                        ? "rgba(255,255,255,0.04)"
                        : plan.color,
                      border: `1px solid ${plan.accent}60`,
                      color: plan.current
                        ? "rgba(255,255,255,0.2)"
                        : plan.accent,
                      boxShadow: plan.current
                        ? "none"
                        : `0 0 12px ${plan.accent}20`,
                    }}
                  >
                    {plan.current ? "Current" : "Upgrade →"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── API KEYS ── */}
        {activeTab === "API Keys" && (
          <div
            className="rounded-3xl p-6 space-y-5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(251,146,60,0.12)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                color: "rgba(251,146,60,0.6)",
                textTransform: "uppercase",
              }}
            >
              API Keys
            </p>
            {[
              {
                label: "Groq API Key",
                placeholder: "gsk_•••••••••••••••",
                hint: "LLM inference",
              },
              {
                label: "SerpAPI Key",
                placeholder: "serp_•••••••••••••••",
                hint: "Web search",
              },
              {
                label: "GITHUB_Token",
                placeholder: "github_pat_xxx",
                hint: "Project URL",
              },
            ].map((field) => (
              <div key={field.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                    }}
                  >
                    {field.label}
                  </label>
                  <span
                    style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}
                  >
                    {field.hint}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={
                      field.label === "Groq API Key"
                        ? apiKeys.groq_key
                        : field.label === "SerpAPI Key"
                          ? apiKeys.serpapi_key
                          : apiKeys.github_token
                    }
                    onChange={(e) =>
                      setApiKeys({
                        ...apiKeys,
                        ...(field.label === "Groq API Key"
                          ? { groq_key: e.target.value }
                          : field.label === "SerpAPI Key"
                            ? { serpapi_key: e.target.value }
                            : { github_token: e.target.value }),
                      })
                    }
                    placeholder={field.placeholder}
                    className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(251,146,60,0.15)",
                      color: "#f0fdf4",
                    }}
                  />
                  <button
                    className="px-4 py-3 rounded-xl text-xs font-semibold"
                    style={{
                      background: "rgba(251,146,60,0.08)",
                      border: "1px solid rgba(251,146,60,0.2)",
                      color: "#fb923c",
                    }}
                    onClick={() => {
                      if (field.label === "Groq API Key") {
                        testGroq();
                      }
                    }}
                  >
                    Test
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between mt-6">
              <button
                className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: "rgba(251,146,60,0.9)",
                  color: "#000",
                  boxShadow: "0 0 16px rgba(251,146,60,0.3)",
                }}
                onClick={saveKeys}
              >
                Save Keys
              </button>

              <button
                className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444",
                }}
                onClick={deleteAllKeys}
              >
                Delete All
              </button>
            </div>
          </div>
        )}

        {/* ── PREFERENCES ── */}
        {activeTab === "Preferences" && (
          <div className="space-y-4">
            <div
              className="rounded-3xl p-6 space-y-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(167,139,250,0.12)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: "rgba(167,139,250,0.6)",
                  textTransform: "uppercase",
                }}
              >
                Model
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  "llama-3.3-70b-versatile",
                  "llama-3.1-8b-instant",
                  "mixtral-8x7b-32768",
                ].map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{
                      background:
                        model === m
                          ? "rgba(167,139,250,0.1)"
                          : "rgba(255,255,255,0.03)",
                      border:
                        model === m
                          ? "1px solid rgba(167,139,250,0.3)"
                          : "1px solid rgba(255,255,255,0.07)",
                      boxShadow:
                        model === m
                          ? "0 0 12px rgba(167,139,250,0.15)"
                          : "none",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        color:
                          model === m ? "#a78bfa" : "rgba(255,255,255,0.4)",
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                      }}
                    >
                      {m}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-3xl p-6 space-y-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(167,139,250,0.12)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: "rgba(167,139,250,0.6)",
                  textTransform: "uppercase",
                }}
              >
                RAG Threshold
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span
                    style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}
                  >
                    Similarity threshold
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#a78bfa",
                      fontFamily: "monospace",
                      textShadow: "0 0 8px #a78bfa80",
                    }}
                  >
                    {ragVal.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={ragVal}
                  onChange={(e) => setRagVal(parseFloat(e.target.value))}
                  className="w-full"
                  style={{ accentColor: "#a78bfa" }}
                />
                <div className="flex justify-between">
                  <span
                    style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}
                  >
                    Strict 0.5
                  </span>
                  <span
                    style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}
                  >
                    Loose 2.0
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-3xl p-6 space-y-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(167,139,250,0.12)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: "rgba(167,139,250,0.6)",
                  textTransform: "uppercase",
                }}
              >
                Features
              </p>
              {[
                {
                  key: "webSearch",
                  label: "Web Search",
                  desc: "Allow agents to search the internet",
                },
                {
                  key: "caching",
                  label: "Smart Caching",
                  desc: "Cache results for identical goals",
                },
                {
                  key: "smartSuggestion",
                  label: "Smart Suggestions",
                  desc: "Automatically fix and retry failed code",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 14,
                        color: "#f0fdf4",
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}
                    >
                      {item.desc}
                    </p>
                  </div>
                  <Toggle
                    on={prefs[item.key as keyof typeof prefs]}
                    onChange={(v) => setPrefs((p) => ({ ...p, [item.key]: v }))}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={savePreferences}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                background: "rgba(167,139,250,0.9)",
                color: "#000",
                boxShadow: "0 0 16px rgba(167,139,250,0.3)",
              }}
            >
              Save Preferences
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
