// import type { Alert, Run, Service, User } from "./adminTypes";

// export const USERS: User[] = [
//   {
//     email: "sarah.k@company.io",
//     plan: "Pro",
//     runs: 2341,
//     tokens: "8.4M",
//     lastActive: "Just now",
//     status: "Active",
//   },
//   {
//     email: "james.dev@ai.co",
//     plan: "Team",
//     runs: 1872,
//     tokens: "6.1M",
//     lastActive: "3m ago",
//     status: "Active",
//   },
//   {
//     email: "research@openlab.org",
//     plan: "Pro",
//     runs: 1403,
//     tokens: "5.7M",
//     lastActive: "18m ago",
//     status: "Active",
//   },
//   {
//     email: "anita.r@startup.vc",
//     plan: "Free",
//     runs: 884,
//     tokens: "2.1M",
//     lastActive: "2h ago",
//     status: "Active",
//   },
//   {
//     email: "mike.chen@corp.com",
//     plan: "Team",
//     runs: 712,
//     tokens: "3.8M",
//     lastActive: "Yesterday",
//     status: "Idle",
//   },
//   {
//     email: "dev@noreply.bot",
//     plan: "Free",
//     runs: 43,
//     tokens: "120K",
//     lastActive: "4d ago",
//     status: "Suspended",
//   },
//   {
//     email: "priya.s@ml.dev",
//     plan: "Pro",
//     runs: 1190,
//     tokens: "4.2M",
//     lastActive: "1h ago",
//     status: "Active",
//   },
//   {
//     email: "tom.w@agency.co",
//     plan: "Team",
//     runs: 620,
//     tokens: "2.9M",
//     lastActive: "5h ago",
//     status: "Idle",
//   },
// ];

// export const RUNS: Run[] = [
//   {
//     id: "run_a8f2c1e3",
//     agent: "Researcher",
//     goal: "Summarize latest AI papers on RAG",
//     duration: "3.4s",
//     tokens: "12,440",
//     status: "OK",
//   },
//   {
//     id: "run_d4e8b9f0",
//     agent: "Coder",
//     goal: "Refactor auth module to use JWT",
//     duration: "31.2s",
//     tokens: "48,120",
//     status: "Timeout",
//   },
//   {
//     id: "run_3c12a0d7",
//     agent: "Planner",
//     goal: "Create sprint plan for Q3 milestones",
//     duration: "5.1s",
//     tokens: "8,800",
//     status: "OK",
//   },
//   {
//     id: "run_7f91e2bc",
//     agent: "RAG",
//     goal: "Query compliance docs for SOC2",
//     duration: "2.8s",
//     tokens: "5,330",
//     status: "OK",
//   },
//   {
//     id: "run_b0d5f4a1",
//     agent: "Coder",
//     goal: "Write unit tests for payment service",
//     duration: "8.7s",
//     tokens: "22,100",
//     status: "Partial",
//   },
//   {
//     id: "run_c9e1d0f2",
//     agent: "Researcher",
//     goal: "Competitive analysis of LLM providers",
//     duration: "6.2s",
//     tokens: "18,900",
//     status: "OK",
//   },
//   {
//     id: "run_f3a7b8e5",
//     agent: "Planner",
//     goal: "Draft OKRs for engineering team Q4",
//     duration: "4.4s",
//     tokens: "7,200",
//     status: "OK",
//   },
//   {
//     id: "run_e2c6d4a0",
//     agent: "Coder",
//     goal: "Fix race condition in task scheduler",
//     duration: "12.1s",
//     tokens: "31,500",
//     status: "Error",
//   },
// ];

// export const WEEK_DATA = [
//   { day: "Mon", runs: 6200, ok: 5900, fail: 300 },
//   { day: "Tue", runs: 7100, ok: 6700, fail: 400 },
//   { day: "Wed", runs: 5800, ok: 5500, fail: 300 },
//   { day: "Thu", runs: 8900, ok: 8400, fail: 500 },
//   { day: "Fri", runs: 7400, ok: 7000, fail: 400 },
//   { day: "Sat", runs: 4200, ok: 3900, fail: 300 },
//   { day: "Sun", runs: 8412, ok: 7930, fail: 482 },
// ];

// export const ROUTE_USAGE = [
//   { name: "Researcher", count: 2841, pct: 67, color: "#22c55e" },
//   { name: "Coder", count: 2103, pct: 50, color: "#3b82f6" },
//   { name: "Planner", count: 1924, pct: 46, color: "#f59e0b" },
//   { name: "RAG", count: 1544, pct: 37, color: "#a78bfa" },
// ];

// export const ALERTS: Alert[] = [
//   {
//     level: "critical",
//     title: "Coder agent timeout spike",
//     desc: "203 timeouts in last hour. Executor queue at 94% depth. Possible model latency degradation.",
//     time: "9 min ago",
//   },
//   {
//     level: "warning",
//     title: "Redis cache miss rate elevated",
//     desc: "38% miss rate against 30% threshold. Consider cache warming or TTL adjustment.",
//     time: "24 min ago",
//   },
//   {
//     level: "info",
//     title: "Scheduled maintenance window",
//     desc: "Database migration planned Jun 06 at 02:00 UTC. Expected downtime 3–5 minutes.",
//     time: "Jun 6",
//   },
// ];

// export const BACKEND_SERVICES: Service[] = [
//   {
//     name: "API Server",
//     sub: "FastAPI · 3 replicas",
//     status: "online",
//     statusLabel: "Online",
//     latency: "42ms",
//     uptime: "99.98%",
//   },
//   {
//     name: "Task Executor",
//     sub: "Docker · queue 94%",
//     status: "degraded",
//     statusLabel: "High Load",
//     latency: "220ms",
//     uptime: "99.81%",
//   },
//   {
//     name: "WebSocket",
//     sub: "847 live connections",
//     status: "online",
//     statusLabel: "Live",
//     latency: "1ms",
//     uptime: "100%",
//   },
//   {
//     name: "Worker Queue",
//     sub: "Bull / Redis-backed",
//     status: "online",
//     statusLabel: "Running",
//     latency: "18ms",
//     uptime: "99.92%",
//   },
// ];

// export const DATABASE_SERVICES: Service[] = [
//   {
//     name: "PostgreSQL",
//     sub: "Primary · 14.8GB",
//     status: "online",
//     statusLabel: "Healthy",
//     latency: "8ms",
//     uptime: "99.99%",
//   },
//   {
//     name: "Read Replica",
//     sub: "Replica lag 2ms",
//     status: "online",
//     statusLabel: "Synced",
//     latency: "11ms",
//     uptime: "99.95%",
//   },
//   {
//     name: "RAG Index",
//     sub: "2,847 vectors indexed",
//     status: "online",
//     statusLabel: "Indexed",
//     latency: "18ms",
//     uptime: "99.90%",
//   },
//   {
//     name: "Migrations",
//     sub: "Last run: 2h ago",
//     status: "online",
//     statusLabel: "Clean",
//     latency: "—",
//     uptime: "—",
//   },
// ];

// export const STORAGE_SERVICES: Service[] = [
//   {
//     name: "S3 Storage",
//     sub: "Object store · 48GB used",
//     status: "online",
//     statusLabel: "Online",
//     latency: "55ms",
//     uptime: "99.99%",
//   },
//   {
//     name: "File Uploads",
//     sub: "Multipart enabled",
//     status: "online",
//     statusLabel: "Active",
//     latency: "62ms",
//     uptime: "99.97%",
//   },
//   {
//     name: "Log Archive",
//     sub: "7-day retention",
//     status: "online",
//     statusLabel: "Archiving",
//     latency: "—",
//     uptime: "—",
//   },
// ];

// export const CACHE_SERVICES: Service[] = [
//   {
//     name: "Redis Cache",
//     sub: "38% miss rate ⚠",
//     status: "degraded",
//     statusLabel: "Degraded",
//     latency: "2ms",
//     uptime: "99.85%",
//   },
//   {
//     name: "Session Store",
//     sub: "1,284 sessions active",
//     status: "online",
//     statusLabel: "Online",
//     latency: "1ms",
//     uptime: "99.97%",
//   },
//   {
//     name: "Rate Limiter",
//     sub: "Sliding window / user",
//     status: "online",
//     statusLabel: "Active",
//     latency: "0.5ms",
//     uptime: "100%",
//   },
// ];
export const ADMIN_TABS = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "runs", label: "Runs" },
  { key: "system", label: "System" },
] as const;
