import { create } from "zustand";

interface AgentEvent {
  node: string;
  messages: string[];
  approved?: boolean;
  error?: string;
}

interface AgentStore {
  events: AgentEvent[];
  status: "idle" | "running" | "done" | "error";
  addEvent: (e: AgentEvent) => void;
  setStatus: (s: AgentStore["status"]) => void;
  reset: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  events: [],
  status: "idle",
  addEvent: (e) => set((s) => ({ events: [...s.events, e] })),
  setStatus: (status) => set({ status }),
  reset: () => set({ events: [], status: "idle" }),
}));
