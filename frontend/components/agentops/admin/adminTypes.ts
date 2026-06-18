export type Tab = "overview" | "users" | "runs" | "system" | "orion";

export type PlanType = "Pro" | "Team" | "Free";

export type UserStatus = "Active" | "Idle" | "Suspended";

export type RunStatus = "OK" | "Timeout" | "Partial" | "Error";

export type AlertLevel = "critical" | "warning" | "info";

export type ServiceStatus = "online" | "degraded" | "offline";

export interface User {
  email: string;
  plan: PlanType;
  runs: number;
  tokens: string;
  lastActive: string;
  status: UserStatus;
}
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Run {
  id: string;
  agent: string;
  goal: string;
  duration: string;
  tokens: string;
  status: RunStatus;
}

export interface Alert {
  level: AlertLevel;
  title: string;
  desc: string;
  time: string;
}

export interface Service {
  name: string;
  sub: string;
  status: ServiceStatus;
  statusLabel: string;
  latency: string;
  uptime: string;
}
