// "use client";

// import {
//   Background,
//   Controls,
//   Handle,
//   MiniMap,
//   NodeTypes,
//   Position,
//   ReactFlow,
//   ReactFlowProvider,
// } from "@xyflow/react";
// import "@xyflow/react/dist/style.css";
// import { useMemo } from "react";
// import { AgentEvent } from "./DashboardTabs";

// interface Props {
//   events: AgentEvent[];
// }

// const AGENT_COLORS: Record<
//   string,
//   { idle: string; active: string; done: string; error: string }
// > = {
//   supervisor: {
//     idle: "#52525b",
//     active: "#7c3aed",
//     done: "#22c55e",
//     error: "#ef4444",
//   },
//   planner: {
//     idle: "#3f3f46",
//     active: "#2563eb",
//     done: "#22c55e",
//     error: "#ef4444",
//   },
//   researcher: {
//     idle: "#3f3f46",
//     active: "#d97706",
//     done: "#22c55e",
//     error: "#ef4444",
//   },
//   coder: {
//     idle: "#3f3f46",
//     active: "#db2777",
//     done: "#22c55e",
//     error: "#ef4444",
//   },
//   critic: {
//     idle: "#3f3f46",
//     active: "#dc2626",
//     done: "#22c55e",
//     error: "#ef4444",
//   },
// };

// // ─── Fixed layout — plenty of space so nodes NEVER overlap ───────────────────
// //  Supervisor  (center top)
// //     |
// //  Planner     (center)
// //   /       \
// // Researcher  Coder
// //   \       /
// //    Critic  (center bottom)
// // ─────────────────────────────────────────────────────────────────────────────
// const LAYOUT = {
//   supervisor: { x: 300, y: 0 },
//   planner: { x: 300, y: 160 },
//   researcher: { x: 60, y: 340 },
//   coder: { x: 540, y: 340 },
//   critic: { x: 300, y: 520 },
// };

// const NODE_W = 160;
// const NODE_H = 70; // min height — grows with content

// const EDGES = [
//   { id: "e1", source: "supervisor", target: "planner", type: "smoothstep" },
//   { id: "e2", source: "planner", target: "researcher", type: "smoothstep" },
//   { id: "e3", source: "planner", target: "coder", type: "smoothstep" },
//   { id: "e4", source: "researcher", target: "critic", type: "straight" }, // ← straight down
//   { id: "e5", source: "coder", target: "critic", type: "straight" }, // ← straight down
// ];

// // ─── Custom node so ReactFlow knows size at definition time ──────────────────
// function AgentNode({ data }: { data: any }) {
//   const { label, status, msg, border, glow } = data;
//   return (
//     <>
//       <Handle
//         type="target"
//         position={Position.Top}
//         style={{ background: border, border: "none" }}
//       />
//       <div
//         style={{
//           width: NODE_W,
//           minHeight: NODE_H,
//           background:
//             status === "active"
//               ? "linear-gradient(180deg,#101014,#09090b)"
//               : "#09090b",
//           border: `2px solid ${border}`,
//           borderRadius: 18,
//           boxShadow: glow,
//           transition: "all .4s ease",
//           opacity: status === "idle" ? 0.65 : 1,
//           transform: status === "active" ? "scale(1.04)" : "scale(1)",
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           justifyContent: "center",
//           padding: "14px 12px",
//           boxSizing: "border-box",
//           color: "#fff",
//           textAlign: "center",
//         }}
//       >
//         <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
//         {status !== "idle" && (
//           <div
//             style={{
//               marginTop: 4,
//               fontSize: 10,
//               fontWeight: 600,
//               textTransform: "uppercase",
//               color: border,
//               letterSpacing: "0.05em",
//             }}
//           >
//             {status}
//           </div>
//         )}
//         {msg && (
//           <div
//             style={{
//               marginTop: 4,
//               fontSize: 9,
//               color: "#71717a",
//               whiteSpace: "normal",
//               wordBreak: "break-word",
//               lineHeight: 1.4,
//             }}
//           >
//             {msg}
//           </div>
//         )}
//       </div>
//       <Handle
//         type="source"
//         position={Position.Bottom}
//         style={{ background: border, border: "none" }}
//       />
//     </>
//   );
// }

// const nodeTypes: NodeTypes = { agent: AgentNode };

// // ─────────────────────────────────────────────────────────────────────────────
// export default function AgentGraph({ events }: Props) {
//   const agentStatus = useMemo(() => {
//     const status: Record<string, "idle" | "active" | "done" | "error"> = {};
//     events.forEach((e) => {
//       status[e.node] = e.error ? "error" : "done";
//     });
//     const last = events[events.length - 1];
//     if (last && !last.approved && !last.error) status[last.node] = "active";
//     return status;
//   }, [events]);

//   const agentMsg = useMemo(() => {
//     const msgs: Record<string, string> = {};
//     events.forEach((e) => {
//       msgs[e.node] = e.messages?.[0]?.slice(0, 50) ?? "";
//     });
//     return msgs;
//   }, [events]);

//   const nodes = useMemo(
//     () =>
//       Object.entries(LAYOUT).map(([id, pos]) => {
//         const s = agentStatus[id] ?? "idle";
//         const colors = AGENT_COLORS[id];
//         const border = colors[s];
//         const glow =
//           s === "active"
//             ? `0 0 20px ${border},0 0 40px ${border}88,0 0 80px ${border}33,inset 0 0 20px ${border}22`
//             : s === "done"
//               ? `0 0 16px #22c55e55`
//               : "none";

//         return {
//           id,
//           type: "agent", // ← use our custom node
//           position: pos,
//           // Tell ReactFlow the fixed size up-front ↓
//           width: NODE_W,
//           height: NODE_H,
//           data: {
//             label: id.charAt(0).toUpperCase() + id.slice(1),
//             status: s,
//             msg: agentMsg[id] ?? "",
//             border,
//             glow,
//           },
//         };
//       }),
//     [agentStatus, agentMsg],
//   );

//   const styledEdges = useMemo(
//     () =>
//       EDGES.map((e) => {
//         const active =
//           agentStatus[e.source] === "done" ||
//           agentStatus[e.source] === "active";
//         return {
//           ...e,
//           type: "smoothstep",
//           animated: active,
//           style: {
//             stroke: active ? "#22c55e" : "#3f3f46",
//             strokeWidth: active ? 3 : 1.2,
//             strokeDasharray: active ? "8 4" : undefined,
//           },
//         };
//       }),
//     [agentStatus],
//   );

//   return (
//     <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black">
//       {/* Stats bar */}
//       <div className="flex items-center gap-6 px-6 py-4 border-b border-zinc-800">
//         <div>
//           <p className="text-xs text-zinc-500">Events</p>
//           <p className="text-lg font-bold text-green-400">{events.length}</p>
//         </div>
//         <div>
//           <p className="text-xs text-zinc-500">Agents Active</p>
//           <p className="text-lg font-bold text-violet-400">
//             {Object.values(agentStatus).filter((s) => s === "active").length}
//           </p>
//         </div>
//         <div>
//           <p className="text-xs text-zinc-500">Status</p>
//           <p className="text-lg font-bold text-pink-400">
//             {Object.values(agentStatus).some((s) => s === "error")
//               ? "⚠ Error"
//               : Object.values(agentStatus).some((s) => s === "active")
//                 ? "⟳ Running"
//                 : events.length > 0
//                   ? "✓ Complete"
//                   : "— Idle"}
//           </p>
//         </div>
//         {events.length === 0 && (
//           <p className="ml-auto text-xs text-zinc-500">
//             Waiting for orchestration events...
//           </p>
//         )}
//       </div>

//       {/* Graph */}
//       <div className="h-[600px]">
//         <ReactFlowProvider>
//           <ReactFlow
//             nodes={nodes}
//             edges={styledEdges}
//             nodeTypes={nodeTypes}
//             fitView
//             fitViewOptions={{ padding: 0.3 }}
//             minZoom={0.4}
//             maxZoom={2}
//             nodesDraggable={false}
//             nodesConnectable={false}
//             proOptions={{ hideAttribution: true }}
//           >
//             <Background color="#27272a" gap={24} />
//             <Controls position="bottom-left" showInteractive={false} />
//             <MiniMap
//               pannable
//               zoomable
//               position="bottom-right"
//               maskColor="rgba(0,0,0,.75)"
//               style={{
//                 width: 160,
//                 height: 100,
//                 background: "#09090b",
//                 borderRadius: 14,
//                 border: "1px solid #27272a",
//               }}
//               nodeColor={(node) => {
//                 const s = agentStatus[node.id] ?? "idle";
//                 return AGENT_COLORS[node.id]?.[s] ?? "#3f3f46";
//               }}
//             />
//           </ReactFlow>
//         </ReactFlowProvider>
//       </div>
//     </div>
//   );
// }

// "use client";

// import {
//   Background,
//   Controls,
//   Handle,
//   MiniMap,
//   NodeTypes,
//   Position,
//   ReactFlow,
//   ReactFlowProvider,
// } from "@xyflow/react";
// import "@xyflow/react/dist/style.css";
// import { useMemo } from "react";
// import { AgentEvent } from "./DashboardTabs";

// interface Props {
//   events: AgentEvent[];
// }

// // ── Agent metadata ────────────────────────────────────────────────────────────
// const AGENT_META: Record<
//   string,
//   {
//     idle: string;
//     active: string;
//     done: string;
//     error: string;
//     icon: string;
//     role: string;
//   }
// > = {
//   supervisor: {
//     idle: "#3a3a3a",
//     active: "#7c3aed",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◈",
//     role: "ORCHESTRATOR",
//   },
//   planner: {
//     idle: "#3a3a3a",
//     active: "#f59e0b",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◎",
//     role: "PLANNER",
//   },
//   researcher: {
//     idle: "#3a3a3a",
//     active: "#f59e0b",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◉",
//     role: "RESEARCHER",
//   },
//   coder: {
//     idle: "#3a3a3a",
//     active: "#f59e0b",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◈",
//     role: "CODER",
//   },
//   critic: {
//     idle: "#3a3a3a",
//     active: "#f59e0b",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◎",
//     role: "CRITIC",
//   },
// };

// const NODE_W = 180;
// const NODE_H = 72;

// const LAYOUT = {
//   supervisor: { x: 260, y: 0 },
//   planner: { x: 260, y: 140 },
//   researcher: { x: 40, y: 300 },
//   coder: { x: 480, y: 300 },
//   critic: { x: 260, y: 460 },
// };

// const EDGES = [
//   { id: "e1", source: "supervisor", target: "planner" },
//   { id: "e2", source: "planner", target: "researcher" },
//   { id: "e3", source: "planner", target: "coder" },
//   { id: "e4", source: "researcher", target: "critic", type: "straight" },
//   { id: "e5", source: "coder", target: "critic", type: "straight" },
// ];

// // ── Custom terminal-style node ────────────────────────────────────────────────
// function TerminalNode({ data }: { data: any }) {
//   const { label, role, icon, status, msg, color } = data;

//   const isActive = status === "active";
//   const isDone = status === "done";
//   const isError = status === "error";
//   const isIdle = status === "idle";

//   const borderColor = isActive
//     ? color
//     : isDone
//       ? "#22c55e"
//       : isError
//         ? "#ef4444"
//         : "#2a2a2a";
//   const accentColor = isActive
//     ? color
//     : isDone
//       ? "#22c55e"
//       : isError
//         ? "#ef4444"
//         : "#3a3a3a";

//   return (
//     <>
//       <Handle
//         type="target"
//         position={Position.Top}
//         style={{ background: accentColor, border: "none", width: 6, height: 6 }}
//       />

//       <div
//         style={{
//           width: NODE_W,
//           minHeight: NODE_H,
//           background: "#0a0a0a",
//           border: `1px solid ${borderColor}`,
//           borderRadius: 0, // sharp corners — terminal feel
//           fontFamily: '"Courier New", Courier, monospace',
//           overflow: "hidden",
//           opacity: isIdle ? 0.5 : 1,
//           transition: "all 0.3s ease",
//           boxShadow: isActive
//             ? `0 0 0 1px ${color}40, inset 0 0 20px ${color}08`
//             : isDone
//               ? `0 0 0 1px #22c55e20`
//               : "none",
//         }}
//       >
//         {/* Header bar */}
//         <div
//           style={{
//             background: isIdle ? "#111" : `${accentColor}15`,
//             borderBottom: `1px solid ${borderColor}`,
//             padding: "4px 8px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: 6,
//           }}
//         >
//           <span
//             style={{
//               fontSize: 9,
//               color: accentColor,
//               letterSpacing: "0.15em",
//               fontWeight: 600,
//             }}
//           >
//             {role}
//           </span>
//           {/* Status dot */}
//           <span
//             style={{
//               width: 6,
//               height: 6,
//               borderRadius: "50%",
//               background: accentColor,
//               display: "inline-block",
//               flexShrink: 0,
//               boxShadow: !isIdle ? `0 0 6px ${accentColor}` : "none",
//             }}
//           />
//         </div>

//         {/* Body */}
//         <div style={{ padding: "8px 10px" }}>
//           <div
//             style={{
//               fontSize: 13,
//               fontWeight: 700,
//               color: isIdle ? "#555" : "#e0e0e0",
//               letterSpacing: "0.05em",
//               display: "flex",
//               alignItems: "center",
//               gap: 6,
//             }}
//           >
//             <span style={{ color: accentColor, fontSize: 11 }}>{icon}</span>
//             {label.toUpperCase()}
//           </div>

//           {/* Status tag */}
//           {!isIdle && (
//             <div
//               style={{
//                 marginTop: 4,
//                 fontSize: 9,
//                 letterSpacing: "0.12em",
//                 color: accentColor,
//               }}
//             >
//               [{status.toUpperCase()}]
//             </div>
//           )}

//           {/* Message */}
//           {msg && (
//             <div
//               style={{
//                 marginTop: 4,
//                 fontSize: 9,
//                 color: "#555",
//                 fontFamily: '"Courier New", monospace',
//                 whiteSpace: "normal",
//                 wordBreak: "break-word",
//                 lineHeight: 1.4,
//                 borderTop: "1px solid #1a1a1a",
//                 paddingTop: 4,
//               }}
//             >
//               &gt; {msg}
//             </div>
//           )}
//         </div>
//       </div>

//       <Handle
//         type="source"
//         position={Position.Bottom}
//         style={{ background: accentColor, border: "none", width: 6, height: 6 }}
//       />
//     </>
//   );
// }

// const nodeTypes: NodeTypes = { terminal: TerminalNode };

// // ── Main component ────────────────────────────────────────────────────────────
// export default function AgentGraph({ events }: Props) {
//   const agentStatus = useMemo(() => {
//     const status: Record<string, "idle" | "active" | "done" | "error"> = {};
//     events.forEach((e) => {
//       status[e.node] = e.error ? "error" : "done";
//     });
//     const last = events[events.length - 1];
//     if (last && !last.approved && !last.error) status[last.node] = "active";
//     return status;
//   }, [events]);

//   const agentMsg = useMemo(() => {
//     const msgs: Record<string, string> = {};
//     events.forEach((e) => {
//       msgs[e.node] = e.messages?.[0]?.slice(0, 45) ?? "";
//     });
//     return msgs;
//   }, [events]);

//   const nodes = useMemo(
//     () =>
//       Object.entries(LAYOUT).map(([id, pos]) => {
//         const s = agentStatus[id] ?? "idle";
//         const meta = AGENT_META[id];
//         const color =
//           s === "done" ? "#22c55e" : s === "error" ? "#ef4444" : meta[s];
//         return {
//           id,
//           type: "terminal",
//           position: pos,
//           width: NODE_W,
//           height: NODE_H,
//           data: {
//             label: id.charAt(0).toUpperCase() + id.slice(1),
//             role: meta.role,
//             icon: meta.icon,
//             status: s,
//             msg: agentMsg[id] ?? "",
//             color,
//           },
//         };
//       }),
//     [agentStatus, agentMsg],
//   );

//   const styledEdges = useMemo(
//     () =>
//       EDGES.map((e) => {
//         const active =
//           agentStatus[e.source] === "done" ||
//           agentStatus[e.source] === "active";
//         return {
//           ...e,
//           type: e.type ?? "smoothstep",
//           animated: active,
//           label: active ? "✓" : undefined,
//           labelStyle: {
//             fontFamily: "monospace",
//             fontSize: 9,
//             fill: "#22c55e",
//             fontWeight: 600,
//           },
//           labelBgStyle: { fill: "#0a0a0a", fillOpacity: 0.9 },
//           style: {
//             stroke: active ? "#22c55e" : "#252525",
//             strokeWidth: active ? 2 : 1,
//             strokeDasharray: active ? "6 3" : "4 4",
//           },
//         };
//       }),
//     [agentStatus],
//   );

//   const totalActive = Object.values(agentStatus).filter(
//     (s) => s === "active",
//   ).length;
//   const totalDone = Object.values(agentStatus).filter(
//     (s) => s === "done",
//   ).length;
//   const hasError = Object.values(agentStatus).some((s) => s === "error");
//   const isRunning = Object.values(agentStatus).some((s) => s === "active");
//   const isComplete = !isRunning && events.length > 0 && !hasError;

//   return (
//     <div
//       style={{ fontFamily: '"Courier New", monospace' }}
//       className="rounded-none overflow-hidden border border-zinc-800 bg-black"
//     >
//       {/* ── Terminal title bar ── */}
//       <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950">
//         {/* Traffic lights */}
//         <div className="flex items-center gap-2">
//           <span className="w-3 h-3 rounded-full bg-red-600 opacity-70" />
//           <span className="w-3 h-3 rounded-full bg-yellow-500 opacity-70" />
//           <span className="w-3 h-3 rounded-full bg-green-600 opacity-70" />
//           <span className="ml-3 text-xs text-zinc-500 tracking-widest uppercase">
//             inference-path · agent-graph
//           </span>
//         </div>
//         <span
//           className="text-xs tracking-widest"
//           style={{
//             color: hasError
//               ? "#ef4444"
//               : isComplete
//                 ? "#22c55e"
//                 : isRunning
//                   ? "#f59e0b"
//                   : "#3f3f46",
//           }}
//         >
//           {hasError
//             ? "● ERR"
//             : isComplete
//               ? "● DONE"
//               : isRunning
//                 ? "● LIVE"
//                 : "○ IDLE"}
//         </span>
//       </div>

//       {/* ── Stats row ── */}
//       <div className="flex items-center gap-8 px-5 py-3 border-b border-zinc-800 bg-black">
//         {[
//           { label: "EVENTS", val: events.length, color: "#22c55e" },
//           { label: "ACTIVE", val: totalActive, color: "#f59e0b" },
//           { label: "DONE", val: totalDone, color: "#22c55e" },
//         ].map(({ label, val, color }) => (
//           <div key={label}>
//             <p className="text-xs text-zinc-600 tracking-widest">{label}</p>
//             <p className="text-base font-bold font-mono" style={{ color }}>
//               {val}
//             </p>
//           </div>
//         ))}
//         <div className="ml-auto">
//           <p className="text-xs text-zinc-600 tracking-widest">STATUS</p>
//           <p
//             className="text-base font-mono font-bold"
//             style={{
//               color: hasError
//                 ? "#ef4444"
//                 : isComplete
//                   ? "#22c55e"
//                   : isRunning
//                     ? "#f59e0b"
//                     : "#3f3f46",
//             }}
//           >
//             {hasError
//               ? "⚠ ERROR"
//               : isComplete
//                 ? "✓ COMPLETE"
//                 : isRunning
//                   ? "⟳ RUNNING"
//                   : "— IDLE"}
//           </p>
//         </div>
//         {events.length === 0 && (
//           <p className="text-xs text-zinc-700 tracking-widest ml-4 animate-pulse">
//             awaiting orchestration events...
//           </p>
//         )}
//       </div>

//       {/* ── Graph canvas ── */}
//       <div className="h-[520px]">
//         <ReactFlowProvider>
//           <ReactFlow
//             nodes={nodes}
//             edges={styledEdges}
//             nodeTypes={nodeTypes}
//             fitView
//             fitViewOptions={{ padding: 0.15 }}
//             minZoom={0.4}
//             maxZoom={2}
//             nodesDraggable={false}
//             nodesConnectable={false}
//             proOptions={{ hideAttribution: true }}
//           >
//             <Background color="#161616" gap={20} size={1} />
//             <Controls position="bottom-left" showInteractive={false} />
//             <MiniMap
//               pannable
//               zoomable
//               position="bottom-right"
//               maskColor="rgba(0,0,0,.85)"
//               style={{
//                 width: 140,
//                 height: 90,
//                 background: "#0a0a0a",
//                 border: "1px solid #1f1f1f",
//                 borderRadius: 0,
//               }}
//               nodeColor={(node) => {
//                 const s = agentStatus[node.id] ?? "idle";
//                 return s === "done"
//                   ? "#22c55e"
//                   : s === "active"
//                     ? "#f59e0b"
//                     : s === "error"
//                       ? "#ef4444"
//                       : "#2a2a2a";
//               }}
//             />
//           </ReactFlow>
//         </ReactFlowProvider>
//       </div>
//     </div>
//   );
// }

// "use client";

// import {
//   Background,
//   BaseEdge,
//   Controls,
//   EdgeProps,
//   getSmoothStepPath,
//   getStraightPath,
//   Handle,
//   MiniMap,
//   NodeTypes,
//   Position,
//   ReactFlow,
//   ReactFlowProvider,
// } from "@xyflow/react";
// import "@xyflow/react/dist/style.css";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { AgentEvent } from "./DashboardTabs";

// interface Props {
//   events: AgentEvent[];
// }

// const AGENT_META: Record<
//   string,
//   {
//     idle: string;
//     active: string;
//     done: string;
//     error: string;
//     icon: string;
//     role: string;
//   }
// > = {
//   supervisor: {
//     idle: "#2a2a2a",
//     active: "#7c3aed",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◈",
//     role: "ORCHESTRATOR",
//   },
//   planner: {
//     idle: "#2a2a2a",
//     active: "#f59e0b",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◎",
//     role: "PLANNER",
//   },
//   researcher: {
//     idle: "#2a2a2a",
//     active: "#f59e0b",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◉",
//     role: "RESEARCHER",
//   },
//   coder: {
//     idle: "#2a2a2a",
//     active: "#f59e0b",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◈",
//     role: "CODER",
//   },
//   critic: {
//     idle: "#2a2a2a",
//     active: "#f59e0b",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◎",
//     role: "CRITIC",
//   },
// };

// const NODE_W = 180;
// const NODE_H = 72;

// const LAYOUT = {
//   supervisor: { x: 260, y: 0 },
//   planner: { x: 260, y: 140 },
//   researcher: { x: 40, y: 300 },
//   coder: { x: 480, y: 300 },
//   critic: { x: 260, y: 460 },
// };

// // Edge→node mapping: which nodes does each edge touch?
// const EDGE_NODES: Record<string, [string, string]> = {
//   e1: ["supervisor", "planner"],
//   e2: ["planner", "researcher"],
//   e3: ["planner", "coder"],
//   e4: ["researcher", "critic"],
//   e5: ["coder", "critic"],
// };

// // Edge travel time in seconds (slow = good)
// const BALL_DUR = 3.5;

// // ── Glow context shared via window ───────────────────────────────────────────
// // We use a simple event bus to notify nodes when a ball arrives
// function emitNodeGlow(nodeId: string) {
//   window.dispatchEvent(new CustomEvent("node-glow", { detail: nodeId }));
// }

// // ── Custom edge with slow travelling ball ─────────────────────────────────────
// function IdleEdge({
//   id,
//   sourceX,
//   sourceY,
//   targetX,
//   targetY,
//   sourcePosition,
//   targetPosition,
//   data,
// }: EdgeProps & {
//   data?: {
//     isIdle: boolean;
//     isDone: boolean;
//     delay: number;
//     straight?: boolean;
//     targetNode: string;
//     sourceNode: string;
//   };
// }) {
//   const isIdle = data?.isIdle ?? false;
//   const isDone = data?.isDone ?? false;
//   const delay = data?.delay ?? 0;
//   const targetNode = data?.targetNode ?? "";
//   const sourceNode = data?.sourceNode ?? "";
//   const active = isIdle || isDone;

//   const [edgePath] = data?.straight
//     ? getStraightPath({ sourceX, sourceY, targetX, targetY })
//     : getSmoothStepPath({
//         sourceX,
//         sourceY,
//         sourcePosition,
//         targetX,
//         targetY,
//         targetPosition,
//       });

//   const stroke = isDone ? "#22c55e" : isIdle ? "#f59e0b" : "#252525";
//   const dur = `${BALL_DUR}s`;
//   const begin = `${delay}s`;

//   // When ball completes one loop → glow target node
//   // We use animateMotion's onrepeat but that's not easily hooked in React SVG
//   // Instead we use a JS interval synced to the animation timing
//   useEffect(() => {
//     if (!active) return;
//     const totalDelay = delay * 1000;
//     const period = BALL_DUR * 1000;

//     // Fire glow on source at start, target at end of each cycle
//     const fireGlows = () => {
//       emitNodeGlow(sourceNode);
//       const t = setTimeout(() => emitNodeGlow(targetNode), period);
//       return t;
//     };

//     const startTimer = setTimeout(() => {
//       fireGlows();
//       const interval = setInterval(() => fireGlows(), period);
//       return () => clearInterval(interval);
//     }, totalDelay % period);

//     return () => clearTimeout(startTimer);
//   }, [active, delay, sourceNode, targetNode]);

//   return (
//     <>
//       <BaseEdge
//         id={id}
//         path={edgePath}
//         style={{
//           stroke,
//           strokeWidth: isDone ? 2 : 1,
//           strokeDasharray: "5 5",
//           opacity: isIdle ? 0.35 : isDone ? 0.9 : 0.15,
//           transition: "opacity 0.5s, stroke 0.5s",
//         }}
//       />
//       {active && (
//         <>
//           {/* Glow halo — larger, very transparent */}
//           <circle r="10" fill={stroke} opacity="0.12">
//             <animateMotion dur={dur} repeatCount="indefinite" begin={begin}>
//               <mpath href={`#${id}`} />
//             </animateMotion>
//           </circle>
//           {/* Mid ring */}
//           <circle r="5.5" fill={stroke} opacity="0.25">
//             <animateMotion dur={dur} repeatCount="indefinite" begin={begin}>
//               <mpath href={`#${id}`} />
//             </animateMotion>
//           </circle>
//           {/* Core ball */}
//           <circle r="3" fill={stroke}>
//             <animateMotion dur={dur} repeatCount="indefinite" begin={begin}>
//               <mpath href={`#${id}`} />
//             </animateMotion>
//           </circle>
//         </>
//       )}
//     </>
//   );
// }

// const edgeTypes = { idleEdge: IdleEdge };

// // ── Terminal node with glow-on-hit effect ─────────────────────────────────────
// function TerminalNode({ data }: { data: any }) {
//   const { label, role, icon, status, msg, color, nodeId } = data;
//   const [glowing, setGlowing] = useState(false);
//   const glowTimer = useRef<ReturnType<typeof setTimeout>>();

//   const isActive = status === "active";
//   const isDone = status === "done";
//   const isError = status === "error";
//   const isIdle = status === "idle";

//   // Listen for ball-hit events
//   useEffect(() => {
//     const handler = (e: Event) => {
//       if ((e as CustomEvent).detail !== nodeId) return;
//       setGlowing(true);
//       clearTimeout(glowTimer.current);
//       glowTimer.current = setTimeout(() => setGlowing(false), 600);
//     };
//     window.addEventListener("node-glow", handler);
//     return () => {
//       window.removeEventListener("node-glow", handler);
//       clearTimeout(glowTimer.current);
//     };
//   }, [nodeId]);

//   const borderColor = glowing
//     ? "#f59e0b"
//     : isActive
//       ? color
//       : isDone
//         ? "#22c55e"
//         : isError
//           ? "#ef4444"
//           : "#222";

//   const accentColor = isActive
//     ? color
//     : isDone
//       ? "#22c55e"
//       : isError
//         ? "#ef4444"
//         : "#f59e0b";

//   const glowShadow = glowing
//     ? `0 0 0 1px #f59e0b80, 0 0 18px #f59e0b50, inset 0 0 12px #f59e0b15`
//     : isActive
//       ? `0 0 0 1px ${color}40, inset 0 0 20px ${color}08`
//       : isDone
//         ? `0 0 0 1px #22c55e20`
//         : "none";

//   return (
//     <>
//       <Handle
//         type="target"
//         position={Position.Top}
//         style={{ background: accentColor, border: "none", width: 6, height: 6 }}
//       />

//       <div
//         style={{
//           width: NODE_W,
//           minHeight: NODE_H,
//           background: glowing ? "#110d00" : "#0a0a0a",
//           border: `1px solid ${borderColor}`,
//           borderRadius: 0,
//           fontFamily: '"Courier New", monospace',
//           overflow: "hidden",
//           opacity: isIdle && !glowing ? 0.55 : 1,
//           transition: "all 0.25s ease",
//           boxShadow: glowShadow,
//         }}
//       >
//         {/* Header */}
//         <div
//           style={{
//             background: glowing
//               ? "#1a1000"
//               : isIdle
//                 ? "#0f0f0f"
//                 : `${accentColor}12`,
//             borderBottom: `1px solid ${borderColor}`,
//             padding: "4px 8px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             transition: "background 0.25s",
//           }}
//         >
//           <span
//             style={{
//               fontSize: 9,
//               color: glowing ? "#f59e0b" : isIdle ? "#444" : accentColor,
//               letterSpacing: "0.15em",
//               fontWeight: 600,
//               transition: "color 0.25s",
//             }}
//           >
//             {role}
//           </span>
//           <span
//             style={{
//               fontSize: 11,
//               color: glowing ? "#f59e0b" : accentColor,
//               display: "inline-block",
//               animation: isIdle ? "rf-spin 4s linear infinite" : "none",
//               transition: "color 0.25s",
//             }}
//           >
//             {icon}
//           </span>
//         </div>

//         {/* Body */}
//         <div style={{ padding: "8px 10px" }}>
//           <div
//             style={{
//               fontSize: 13,
//               fontWeight: 700,
//               letterSpacing: "0.05em",
//               color: glowing ? "#f5c060" : isIdle ? "#333" : "#e0e0e0",
//               transition: "color 0.25s",
//             }}
//           >
//             {label.toUpperCase()}
//           </div>
//           {!isIdle && (
//             <div
//               style={{
//                 marginTop: 4,
//                 fontSize: 9,
//                 letterSpacing: "0.12em",
//                 color: accentColor,
//               }}
//             >
//               [{status.toUpperCase()}]
//             </div>
//           )}
//           {isIdle && glowing && (
//             <div
//               style={{
//                 marginTop: 4,
//                 fontSize: 9,
//                 letterSpacing: "0.12em",
//                 color: "#f59e0b88",
//               }}
//             >
//               [SIGNAL]
//             </div>
//           )}
//           {msg && (
//             <div
//               style={{
//                 marginTop: 4,
//                 fontSize: 9,
//                 color: "#555",
//                 whiteSpace: "normal",
//                 wordBreak: "break-word",
//                 lineHeight: 1.4,
//                 borderTop: "1px solid #1a1a1a",
//                 paddingTop: 4,
//               }}
//             >
//               &gt; {msg}
//             </div>
//           )}
//         </div>
//       </div>

//       <Handle
//         type="source"
//         position={Position.Bottom}
//         style={{ background: accentColor, border: "none", width: 6, height: 6 }}
//       />
//     </>
//   );
// }

// const nodeTypes: NodeTypes = { terminal: TerminalNode };

// // ── Main ──────────────────────────────────────────────────────────────────────
// export default function AgentGraph({ events }: Props) {
//   const agentStatus = useMemo(() => {
//     const status: Record<string, "idle" | "active" | "done" | "error"> = {};
//     events.forEach((e) => {
//       status[e.node] = e.error ? "error" : "done";
//     });
//     const last = events[events.length - 1];
//     if (last && !last.approved && !last.error) status[last.node] = "active";
//     return status;
//   }, [events]);

//   const agentMsg = useMemo(() => {
//     const msgs: Record<string, string> = {};
//     events.forEach((e) => {
//       msgs[e.node] = e.messages?.[0]?.slice(0, 45) ?? "";
//     });
//     return msgs;
//   }, [events]);

//   const isIdle = events.length === 0;
//   const hasError = Object.values(agentStatus).some((s) => s === "error");
//   const isRunning = Object.values(agentStatus).some((s) => s === "active");
//   const isComplete = !isRunning && events.length > 0 && !hasError;

//   const nodes = useMemo(
//     () =>
//       Object.entries(LAYOUT).map(([id, pos]) => {
//         const s = agentStatus[id] ?? "idle";
//         const meta = AGENT_META[id];
//         const color =
//           s === "done" ? "#22c55e" : s === "error" ? "#ef4444" : meta[s];
//         return {
//           id,
//           type: "terminal",
//           position: pos,
//           width: NODE_W,
//           height: NODE_H,
//           data: {
//             label: id.charAt(0).toUpperCase() + id.slice(1),
//             role: meta.role,
//             icon: meta.icon,
//             status: s,
//             msg: agentMsg[id] ?? "",
//             color,
//             nodeId: id, // pass id so node can filter events
//           },
//         };
//       }),
//     [agentStatus, agentMsg],
//   );

//   const styledEdges = useMemo(() => {
//     const defs = [
//       {
//         id: "e1",
//         source: "supervisor",
//         target: "planner",
//         delay: 0,
//         straight: false,
//       },
//       {
//         id: "e2",
//         source: "planner",
//         target: "researcher",
//         delay: 0.8,
//         straight: false,
//       },
//       {
//         id: "e3",
//         source: "planner",
//         target: "coder",
//         delay: 1.6,
//         straight: false,
//       },
//       {
//         id: "e4",
//         source: "researcher",
//         target: "critic",
//         delay: 2.4,
//         straight: true,
//       },
//       {
//         id: "e5",
//         source: "coder",
//         target: "critic",
//         delay: 3.2,
//         straight: true,
//       },
//     ];
//     return defs.map((e) => {
//       const isDone =
//         agentStatus[e.source] === "done" || agentStatus[e.source] === "active";
//       return {
//         id: e.id,
//         source: e.source,
//         target: e.target,
//         type: "idleEdge",
//         data: {
//           isIdle,
//           isDone,
//           delay: e.delay,
//           straight: e.straight,
//           sourceNode: e.source,
//           targetNode: e.target,
//         },
//         label: isDone ? "✓" : undefined,
//         labelStyle: {
//           fontFamily: "monospace",
//           fontSize: 9,
//           fill: "#22c55e",
//           fontWeight: 600,
//         },
//         labelBgStyle: { fill: "#0a0a0a", fillOpacity: 0.9 },
//       };
//     });
//   }, [agentStatus, isIdle]);

//   return (
//     <>
//       <style>{`
//         @keyframes rf-spin  { to { transform: rotate(360deg); } }
//         @keyframes rf-pulse { 0%,100%{opacity:.25} 50%{opacity:.9} }
//       `}</style>

//       <div
//         style={{ fontFamily: '"Courier New", monospace' }}
//         className="overflow-hidden border border-zinc-800 bg-black"
//       >
//         {/* Title bar */}
//         <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950">
//           <div className="flex items-center gap-2">
//             <span className="w-3 h-3 rounded-full bg-red-600 opacity-70" />
//             <span className="w-3 h-3 rounded-full bg-yellow-500 opacity-70" />
//             <span className="w-3 h-3 rounded-full bg-green-600 opacity-70" />
//             <span className="ml-3 text-xs text-zinc-500 tracking-widest uppercase">
//               inference-path · agent-graph
//             </span>
//           </div>
//           <span
//             className="text-xs tracking-widest"
//             style={{
//               color: hasError ? "#ef4444" : isComplete ? "#22c55e" : "#f59e0b",
//               animation: isIdle ? "rf-pulse 2s ease-in-out infinite" : "none",
//             }}
//           >
//             {hasError
//               ? "● ERR"
//               : isComplete
//                 ? "● DONE"
//                 : isRunning
//                   ? "● LIVE"
//                   : "◌ IDLE"}
//           </span>
//         </div>

//         {/* Stats */}
//         <div className="flex items-center gap-8 px-5 py-3 border-b border-zinc-800 bg-black">
//           {[
//             { label: "EVENTS", val: events.length, color: "#22c55e" },
//             {
//               label: "ACTIVE",
//               val: Object.values(agentStatus).filter((s) => s === "active")
//                 .length,
//               color: "#f59e0b",
//             },
//             {
//               label: "DONE",
//               val: Object.values(agentStatus).filter((s) => s === "done")
//                 .length,
//               color: "#22c55e",
//             },
//           ].map(({ label, val, color }) => (
//             <div key={label}>
//               <p className="text-xs text-zinc-600 tracking-widest">{label}</p>
//               <p className="text-base font-bold font-mono" style={{ color }}>
//                 {val}
//               </p>
//             </div>
//           ))}
//           <div className="ml-auto">
//             <p className="text-xs text-zinc-600 tracking-widest">STATUS</p>
//             <p
//               className="text-base font-mono font-bold"
//               style={{
//                 color: hasError
//                   ? "#ef4444"
//                   : isComplete
//                     ? "#22c55e"
//                     : isRunning
//                       ? "#f59e0b"
//                       : "#f59e0b",
//               }}
//             >
//               {hasError
//                 ? "⚠ ERROR"
//                 : isComplete
//                   ? "✓ COMPLETE"
//                   : isRunning
//                     ? "⟳ RUNNING"
//                     : "— IDLE"}
//             </p>
//           </div>
//           {isIdle && (
//             <p
//               className="text-xs text-zinc-700 tracking-widest ml-4 font-mono"
//               style={{ animation: "rf-pulse 1.5s ease-in-out infinite" }}
//             >
//               awaiting orchestration events...
//             </p>
//           )}
//         </div>

//         {/* Graph */}
//         <div className="h-[520px]">
//           <ReactFlowProvider>
//             <ReactFlow
//               nodes={nodes}
//               edges={styledEdges}
//               nodeTypes={nodeTypes}
//               edgeTypes={edgeTypes}
//               fitView
//               fitViewOptions={{ padding: 0.15 }}
//               minZoom={0.4}
//               maxZoom={2}
//               nodesDraggable={false}
//               nodesConnectable={false}
//               proOptions={{ hideAttribution: true }}
//             >
//               <Background color="#111" gap={20} size={1} />
//               <Controls position="bottom-left" showInteractive={false} />
//               <MiniMap
//                 pannable
//                 zoomable
//                 position="bottom-right"
//                 maskColor="rgba(0,0,0,.85)"
//                 style={{
//                   width: 130,
//                   height: 85,
//                   background: "#0a0a0a",
//                   border: "1px solid #1f1f1f",
//                   borderRadius: 0,
//                 }}
//                 nodeColor={(node) => {
//                   const s = agentStatus[node.id] ?? "idle";
//                   return s === "done"
//                     ? "#22c55e"
//                     : s === "active"
//                       ? "#f59e0b"
//                       : s === "error"
//                         ? "#ef4444"
//                         : "#1a1a1a";
//                 }}
//               />
//             </ReactFlow>
//           </ReactFlowProvider>
//         </div>
//       </div>
//     </>
//   );
// }

// "use client";

// import {
//   Background,
//   BaseEdge,
//   Controls,
//   EdgeProps,
//   getSmoothStepPath,
//   getStraightPath,
//   Handle,
//   MiniMap,
//   NodeTypes,
//   Position,
//   ReactFlow,
//   ReactFlowProvider,
// } from "@xyflow/react";
// import "@xyflow/react/dist/style.css";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { AgentEvent } from "./DashboardTabs";

// interface Props {
//   events: AgentEvent[];
// }

// const AGENT_META: Record<
//   string,
//   {
//     idle: string;
//     active: string;
//     done: string;
//     error: string;
//     icon: string;
//     role: string;
//   }
// > = {
//   supervisor: {
//     idle: "#2a2a2a",
//     active: "#7c3aed",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◈",
//     role: "ORCHESTRATOR",
//   },
//   planner: {
//     idle: "#2a2a2a",
//     active: "#f59e0b",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◎",
//     role: "PLANNER",
//   },
//   researcher: {
//     idle: "#2a2a2a",
//     active: "#f59e0b",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◉",
//     role: "RESEARCHER",
//   },
//   coder: {
//     idle: "#2a2a2a",
//     active: "#f59e0b",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◈",
//     role: "CODER",
//   },
//   critic: {
//     idle: "#2a2a2a",
//     active: "#f59e0b",
//     done: "#22c55e",
//     error: "#ef4444",
//     icon: "◎",
//     role: "CRITIC",
//   },
// };

// const NODE_W = 180;
// const NODE_H = 72;

// const LAYOUT = {
//   supervisor: { x: 260, y: 0 },
//   planner: { x: 260, y: 140 },
//   researcher: { x: 40, y: 300 },
//   coder: { x: 480, y: 300 },
//   critic: { x: 260, y: 460 },
// };

// // Sequential edge chain — ball travels one at a time in order
// // Total loop: supervisor→planner→researcher→critic + planner→coder→critic
// // We orchestrate via precise offset timing
// const BALL_DUR = 2.5; // seconds per edge

// // Edge definitions with exact timing offsets
// const EDGE_DEFS = [
//   {
//     id: "e1",
//     source: "supervisor",
//     target: "planner",
//     straight: false,
//     offset: 0,
//   },
//   {
//     id: "e2",
//     source: "planner",
//     target: "researcher",
//     straight: false,
//     offset: BALL_DUR,
//   },
//   {
//     id: "e3",
//     source: "planner",
//     target: "coder",
//     straight: false,
//     offset: BALL_DUR * 1.5,
//   },
//   {
//     id: "e4",
//     source: "researcher",
//     target: "critic",
//     straight: true,
//     offset: BALL_DUR * 2,
//   },
//   {
//     id: "e5",
//     source: "coder",
//     target: "critic",
//     straight: true,
//     offset: BALL_DUR * 2.5,
//   },
// ];

// const TOTAL_LOOP = BALL_DUR * 3.5; // full cycle duration

// // Global glow bus — precise timing synced to SVG animation
// const glowBus = {
//   listeners: new Map<string, Set<() => void>>(),
//   on(id: string, fn: () => void) {
//     if (!this.listeners.has(id)) this.listeners.set(id, new Set());
//     this.listeners.get(id)!.add(fn);
//   },
//   off(id: string, fn: () => void) {
//     this.listeners.get(id)?.delete(fn);
//   },
//   emit(id: string) {
//     this.listeners.get(id)?.forEach((fn) => fn());
//   },
// };

// // Master timer — fires node glows at precise intervals
// // Runs once globally via module-level singleton
// let masterTimerStarted = false;
// function startMasterTimer(isIdle: boolean) {
//   if (masterTimerStarted || !isIdle) return;
//   masterTimerStarted = true;

//   const loop = () => {
//     const now = performance.now();
//     const t = (now / 1000) % TOTAL_LOOP;

//     EDGE_DEFS.forEach(({ source, target, offset }) => {
//       const edgeStart = offset % TOTAL_LOOP;
//       const edgeEnd = (offset + BALL_DUR) % TOTAL_LOOP;
//       const windowSize = 0.08; // seconds — glow window at arrival

//       // Glow source at edge start
//       if (Math.abs(t - edgeStart) < windowSize) glowBus.emit(source);
//       // Glow target at edge end
//       if (Math.abs(t - edgeEnd) < windowSize) glowBus.emit(target);
//     });

//     requestAnimationFrame(loop);
//   };
//   requestAnimationFrame(loop);
// }

// // ── Custom edge ───────────────────────────────────────────────────────────────
// function IdleEdge({
//   id,
//   sourceX,
//   sourceY,
//   targetX,
//   targetY,
//   sourcePosition,
//   targetPosition,
//   data,
// }: EdgeProps & { data?: any }) {
//   const isIdle = data?.isIdle ?? false;
//   const isDone = data?.isDone ?? false;
//   const offset = data?.offset ?? 0;
//   const straight = data?.straight ?? false;
//   const active = isIdle || isDone;

//   const [edgePath] = straight
//     ? getStraightPath({ sourceX, sourceY, targetX, targetY })
//     : getSmoothStepPath({
//         sourceX,
//         sourceY,
//         sourcePosition,
//         targetX,
//         targetY,
//         targetPosition,
//       });

//   const stroke = isDone ? "#22c55e" : isIdle ? "#f59e0b" : "#252525";
//   // Each edge ball: delay = offset, duration = BALL_DUR, loop = TOTAL_LOOP
//   // begin = "-Xs" to start mid-animation so they don't all start at 0
//   const dur = `${TOTAL_LOOP}s`;
//   // keyTimes: ball visible only during its slice of the total loop
//   const startPct = (offset / TOTAL_LOOP).toFixed(4);
//   const endPct = ((offset + BALL_DUR) / TOTAL_LOOP).toFixed(4);

//   return (
//     <>
//       <BaseEdge
//         id={id}
//         path={edgePath}
//         style={{
//           stroke,
//           strokeWidth: isDone ? 2 : 1,
//           strokeDasharray: "5 5",
//           opacity: isIdle ? 0.3 : isDone ? 0.9 : 0.12,
//           transition: "opacity 0.5s, stroke 0.5s",
//         }}
//       />

//       {active && (
//         <>
//           {/* Halo */}
//           <circle r="12" fill={stroke} opacity="0">
//             <animate
//               attributeName="opacity"
//               values={`0;0;0.08;0.08;0`}
//               keyTimes={`0;${startPct};${+startPct + 0.01};${endPct};1`}
//               dur={dur}
//               repeatCount="indefinite"
//             />
//             <animateMotion dur={dur} repeatCount="indefinite">
//               <mpath href={`#${id}`} />
//             </animateMotion>
//           </circle>
//           {/* Mid */}
//           <circle r="5" fill={stroke} opacity="0">
//             <animate
//               attributeName="opacity"
//               values={`0;0;0.3;0.3;0`}
//               keyTimes={`0;${startPct};${+startPct + 0.01};${endPct};1`}
//               dur={dur}
//               repeatCount="indefinite"
//             />
//             <animateMotion dur={dur} repeatCount="indefinite">
//               <mpath href={`#${id}`} />
//             </animateMotion>
//           </circle>
//           {/* Core */}
//           <circle r="3" fill={stroke} opacity="0">
//             <animate
//               attributeName="opacity"
//               values={`0;0;1;1;0`}
//               keyTimes={`0;${startPct};${+startPct + 0.01};${endPct};1`}
//               dur={dur}
//               repeatCount="indefinite"
//             />
//             <animateMotion dur={dur} repeatCount="indefinite">
//               <mpath href={`#${id}`} />
//             </animateMotion>
//           </circle>
//         </>
//       )}
//     </>
//   );
// }

// const edgeTypes = { idleEdge: IdleEdge };

// // ── Terminal node ─────────────────────────────────────────────────────────────
// function TerminalNode({ data }: { data: any }) {
//   const { label, role, icon, status, msg, color, nodeId } = data;
//   const [glowing, setGlowing] = useState(false);
//   const glowTimer = useRef<ReturnType<typeof setTimeout>>();

//   useEffect(() => {
//     const handler = () => {
//       setGlowing(true);
//       clearTimeout(glowTimer.current);
//       glowTimer.current = setTimeout(() => setGlowing(false), 500);
//     };
//     glowBus.on(nodeId, handler);
//     return () => {
//       glowBus.off(nodeId, handler);
//       clearTimeout(glowTimer.current);
//     };
//   }, [nodeId]);

//   const isActive = status === "active";
//   const isDone = status === "done";
//   const isError = status === "error";
//   const isIdle = status === "idle";

//   const borderColor = glowing
//     ? "#f59e0b"
//     : isActive
//       ? color
//       : isDone
//         ? "#22c55e"
//         : isError
//           ? "#ef4444"
//           : "#222";
//   const accentColor = isActive
//     ? color
//     : isDone
//       ? "#22c55e"
//       : isError
//         ? "#ef4444"
//         : "#f59e0b";

//   return (
//     <>
//       <Handle
//         type="target"
//         position={Position.Top}
//         style={{ background: accentColor, border: "none", width: 6, height: 6 }}
//       />
//       <div
//         style={{
//           width: NODE_W,
//           minHeight: NODE_H,
//           background: glowing ? "#110d00" : "#0a0a0a",
//           border: `1px solid ${borderColor}`,
//           borderRadius: 0,
//           fontFamily: '"Courier New", monospace',
//           overflow: "hidden",
//           opacity: isIdle && !glowing ? 0.5 : 1,
//           transition: "all 0.2s ease",
//           boxShadow: glowing
//             ? `0 0 0 1px #f59e0b60, 0 0 16px #f59e0b40, inset 0 0 10px #f59e0b10`
//             : isActive
//               ? `0 0 0 1px ${color}40`
//               : isDone
//                 ? `0 0 0 1px #22c55e20`
//                 : "none",
//         }}
//       >
//         <div
//           style={{
//             background: glowing
//               ? "#180f00"
//               : isIdle
//                 ? "#0f0f0f"
//                 : `${accentColor}12`,
//             borderBottom: `1px solid ${borderColor}`,
//             padding: "4px 8px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             transition: "background 0.2s",
//           }}
//         >
//           <span
//             style={{
//               fontSize: 9,
//               color: glowing ? "#f5a623" : isIdle ? "#444" : accentColor,
//               letterSpacing: "0.15em",
//               fontWeight: 600,
//             }}
//           >
//             {role}
//           </span>
//           <span
//             style={{
//               fontSize: 11,
//               color: glowing ? "#f59e0b" : accentColor,
//               display: "inline-block",
//               animation: isIdle ? "rf-spin 4s linear infinite" : "none",
//             }}
//           >
//             {icon}
//           </span>
//         </div>
//         <div style={{ padding: "8px 10px" }}>
//           <div
//             style={{
//               fontSize: 13,
//               fontWeight: 700,
//               letterSpacing: "0.05em",
//               color: glowing ? "#f5c060" : isIdle ? "#333" : "#e0e0e0",
//               transition: "color 0.2s",
//             }}
//           >
//             {label.toUpperCase()}
//           </div>
//           {(!isIdle || glowing) && (
//             <div
//               style={{
//                 marginTop: 4,
//                 fontSize: 9,
//                 letterSpacing: "0.12em",
//                 color: glowing ? "#f59e0baa" : accentColor,
//               }}
//             >
//               {glowing ? "[SIGNAL]" : `[${status.toUpperCase()}]`}
//             </div>
//           )}
//           {msg && !glowing && (
//             <div
//               style={{
//                 marginTop: 4,
//                 fontSize: 9,
//                 color: "#555",
//                 whiteSpace: "normal",
//                 wordBreak: "break-word",
//                 lineHeight: 1.4,
//                 borderTop: "1px solid #1a1a1a",
//                 paddingTop: 4,
//               }}
//             >
//               &gt; {msg}
//             </div>
//           )}
//         </div>
//       </div>
//       <Handle
//         type="source"
//         position={Position.Bottom}
//         style={{ background: accentColor, border: "none", width: 6, height: 6 }}
//       />
//     </>
//   );
// }

// const nodeTypes: NodeTypes = { terminal: TerminalNode };

// // ── Main ──────────────────────────────────────────────────────────────────────
// export default function AgentGraph({ events }: Props) {
//   const agentStatus = useMemo(() => {
//     const status: Record<string, "idle" | "active" | "done" | "error"> = {};
//     events.forEach((e) => {
//       status[e.node] = e.error ? "error" : "done";
//     });
//     const last = events[events.length - 1];
//     if (last && !last.approved && !last.error) status[last.node] = "active";
//     return status;
//   }, [events]);

//   const agentMsg = useMemo(() => {
//     const msgs: Record<string, string> = {};
//     events.forEach((e) => {
//       msgs[e.node] = e.messages?.[0]?.slice(0, 45) ?? "";
//     });
//     return msgs;
//   }, [events]);

//   const isIdle = events.length === 0;
//   const hasError = Object.values(agentStatus).some((s) => s === "error");
//   const isRunning = Object.values(agentStatus).some((s) => s === "active");
//   const isComplete = !isRunning && events.length > 0 && !hasError;

//   // Start master glow timer when idle
//   useEffect(() => {
//     if (isIdle) {
//       masterTimerStarted = false;
//       startMasterTimer(true);
//     }
//   }, [isIdle]);

//   const nodes = useMemo(
//     () =>
//       Object.entries(LAYOUT).map(([id, pos]) => {
//         const s = agentStatus[id] ?? "idle";
//         const meta = AGENT_META[id];
//         const color =
//           s === "done" ? "#22c55e" : s === "error" ? "#ef4444" : meta[s];
//         return {
//           id,
//           type: "terminal",
//           position: pos,
//           width: NODE_W,
//           height: NODE_H,
//           data: {
//             label: id.charAt(0).toUpperCase() + id.slice(1),
//             role: meta.role,
//             icon: meta.icon,
//             status: s,
//             msg: agentMsg[id] ?? "",
//             color,
//             nodeId: id,
//           },
//         };
//       }),
//     [agentStatus, agentMsg],
//   );

//   const styledEdges = useMemo(
//     () =>
//       EDGE_DEFS.map((e) => {
//         const isDone =
//           agentStatus[e.source] === "done" ||
//           agentStatus[e.source] === "active";
//         return {
//           id: e.id,
//           source: e.source,
//           target: e.target,
//           type: "idleEdge",
//           data: {
//             isIdle,
//             isDone,
//             offset: e.offset,
//             straight: e.straight,
//             sourceNode: e.source,
//             targetNode: e.target,
//           },
//           label: isDone ? "✓" : undefined,
//           labelStyle: {
//             fontFamily: "monospace",
//             fontSize: 9,
//             fill: "#22c55e",
//             fontWeight: 600,
//           },
//           labelBgStyle: { fill: "#0a0a0a", fillOpacity: 0.9 },
//         };
//       }),
//     [agentStatus, isIdle],
//   );

//   return (
//     <>
//       <style>{`
//         @keyframes rf-spin  { to { transform: rotate(360deg); } }
//         @keyframes rf-pulse { 0%,100%{opacity:.2} 50%{opacity:.9} }
//       `}</style>
//       <div
//         style={{ fontFamily: '"Courier New", monospace' }}
//         className="overflow-hidden border border-zinc-800 bg-black"
//       >
//         {/* Title bar */}
//         <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950">
//           <div className="flex items-center gap-2">
//             <span className="w-3 h-3 rounded-full bg-red-600 opacity-70" />
//             <span className="w-3 h-3 rounded-full bg-yellow-500 opacity-70" />
//             <span className="w-3 h-3 rounded-full bg-green-600 opacity-70" />
//             <span className="ml-3 text-xs text-zinc-500 tracking-widest uppercase">
//               inference-path · agent-graph
//             </span>
//           </div>
//           <span
//             className="text-xs tracking-widest"
//             style={{
//               color: hasError ? "#ef4444" : isComplete ? "#22c55e" : "#f59e0b",
//               animation: isIdle ? "rf-pulse 2s ease-in-out infinite" : "none",
//             }}
//           >
//             {hasError
//               ? "● ERR"
//               : isComplete
//                 ? "● DONE"
//                 : isRunning
//                   ? "● LIVE"
//                   : "◌ IDLE"}
//           </span>
//         </div>

//         {/* Stats */}
//         <div className="flex items-center gap-8 px-5 py-3 border-b border-zinc-800 bg-black">
//           {[
//             { label: "EVENTS", val: events.length, color: "#22c55e" },
//             {
//               label: "ACTIVE",
//               val: Object.values(agentStatus).filter((s) => s === "active")
//                 .length,
//               color: "#f59e0b",
//             },
//             {
//               label: "DONE",
//               val: Object.values(agentStatus).filter((s) => s === "done")
//                 .length,
//               color: "#22c55e",
//             },
//           ].map(({ label, val, color }) => (
//             <div key={label}>
//               <p className="text-xs text-zinc-600 tracking-widest">{label}</p>
//               <p className="text-base font-bold font-mono" style={{ color }}>
//                 {val}
//               </p>
//             </div>
//           ))}
//           <div className="ml-auto">
//             <p className="text-xs text-zinc-600 tracking-widest">STATUS</p>
//             <p
//               className="text-base font-mono font-bold"
//               style={{
//                 color: hasError
//                   ? "#ef4444"
//                   : isComplete
//                     ? "#22c55e"
//                     : isRunning
//                       ? "#f59e0b"
//                       : "#f59e0b",
//               }}
//             >
//               {hasError
//                 ? "⚠ ERROR"
//                 : isComplete
//                   ? "✓ COMPLETE"
//                   : isRunning
//                     ? "⟳ RUNNING"
//                     : "— IDLE"}
//             </p>
//           </div>
//           {isIdle && (
//             <p
//               className="text-xs text-zinc-700 tracking-widest ml-4 font-mono"
//               style={{ animation: "rf-pulse 1.5s ease-in-out infinite" }}
//             >
//               awaiting orchestration events...
//             </p>
//           )}
//         </div>

//         {/* Graph — height 600px */}
//         <div className="h-[600px]">
//           <ReactFlowProvider>
//             <ReactFlow
//               nodes={nodes}
//               edges={styledEdges}
//               nodeTypes={nodeTypes}
//               edgeTypes={edgeTypes}
//               fitView
//               fitViewOptions={{ padding: 0.15 }}
//               minZoom={0.4}
//               maxZoom={2}
//               nodesDraggable={false}
//               nodesConnectable={false}
//               proOptions={{ hideAttribution: true }}
//             >
//               <Background color="#111" gap={20} size={1} />
//               <Controls position="bottom-left" showInteractive={false} />
//               <MiniMap
//                 pannable
//                 zoomable
//                 position="bottom-right"
//                 maskColor="rgba(0,0,0,.85)"
//                 style={{
//                   width: 130,
//                   height: 85,
//                   background: "#0a0a0a",
//                   border: "1px solid #1f1f1f",
//                   borderRadius: 0,
//                 }}
//                 nodeColor={(node) => {
//                   const s = agentStatus[node.id] ?? "idle";
//                   return s === "done"
//                     ? "#22c55e"
//                     : s === "active"
//                       ? "#f59e0b"
//                       : s === "error"
//                         ? "#ef4444"
//                         : "#1a1a1a";
//                 }}
//               />
//             </ReactFlow>
//           </ReactFlowProvider>
//         </div>
//       </div>
//     </>
//   );
// }

"use client";

import {
  Background,
  BaseEdge,
  Controls,
  EdgeProps,
  getSmoothStepPath,
  getStraightPath,
  Handle,
  MiniMap,
  NodeTypes,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { AgentEvent } from "./DashboardTabs";

interface Props {
  events: AgentEvent[];
}

const AGENT_META: Record<
  string,
  {
    idle: string;
    active: string;
    done: string;
    error: string;
    icon: string;
    role: string;
  }
> = {
  supervisor: {
    idle: "#2a2a2a",
    active: "#7c3aed",
    done: "#22c55e",
    error: "#ef4444",
    icon: "◈",
    role: "ORCHESTRATOR",
  },
  planner: {
    idle: "#2a2a2a",
    active: "#f59e0b",
    done: "#22c55e",
    error: "#ef4444",
    icon: "◎",
    role: "PLANNER",
  },
  researcher: {
    idle: "#2a2a2a",
    active: "#f59e0b",
    done: "#22c55e",
    error: "#ef4444",
    icon: "◉",
    role: "RESEARCHER",
  },
  coder: {
    idle: "#2a2a2a",
    active: "#f59e0b",
    done: "#22c55e",
    error: "#ef4444",
    icon: "◈",
    role: "CODER",
  },
  critic: {
    idle: "#2a2a2a",
    active: "#f59e0b",
    done: "#22c55e",
    error: "#ef4444",
    icon: "◎",
    role: "CRITIC",
  },
};

const NODE_W = 180;
const NODE_H = 72;

const LAYOUT = {
  supervisor: { x: 260, y: 0 },
  planner: { x: 260, y: 140 },
  researcher: { x: 40, y: 300 },
  coder: { x: 480, y: 300 },
  critic: { x: 260, y: 460 },
};

// Sequential edge chain — ball travels one at a time in order
// Total loop: supervisor→planner→researcher→critic + planner→coder→critic
// We orchestrate via precise offset timing
const BALL_DUR = 2.5; // seconds per edge

// Edge definitions with exact timing offsets
const EDGE_DEFS = [
  {
    id: "e1",
    source: "supervisor",
    target: "planner",
    straight: false,
    offset: 0,
  },
  {
    id: "e2",
    source: "planner",
    target: "researcher",
    straight: false,
    offset: BALL_DUR,
  },
  {
    id: "e3",
    source: "planner",
    target: "coder",
    straight: false,
    offset: BALL_DUR * 1.5,
  },
  {
    id: "e4",
    source: "researcher",
    target: "critic",
    straight: true,
    offset: BALL_DUR * 2,
  },
  {
    id: "e5",
    source: "coder",
    target: "critic",
    straight: true,
    offset: BALL_DUR * 2.5,
  },
];

const TOTAL_LOOP = BALL_DUR * 3.5; // full cycle duration

// Global glow bus — precise timing synced to SVG animation
const glowBus = {
  listeners: new Map<string, Set<() => void>>(),
  on(id: string, fn: () => void) {
    if (!this.listeners.has(id)) this.listeners.set(id, new Set());
    this.listeners.get(id)!.add(fn);
  },
  off(id: string, fn: () => void) {
    this.listeners.get(id)?.delete(fn);
  },
  emit(id: string) {
    this.listeners.get(id)?.forEach((fn) => fn());
  },
};

// Master timer — fires node glows at precise intervals
// Runs once globally via module-level singleton
let masterTimerStarted = false;
function startMasterTimer(isIdle: boolean) {
  if (masterTimerStarted || !isIdle) return;
  masterTimerStarted = true;

  const loop = () => {
    const now = performance.now();
    const t = (now / 1000) % TOTAL_LOOP;

    EDGE_DEFS.forEach(({ source, target, offset }) => {
      const edgeStart = offset % TOTAL_LOOP;
      const edgeEnd = (offset + BALL_DUR) % TOTAL_LOOP;
      const windowSize = 0.08; // seconds — glow window at arrival

      // Glow source at edge start
      if (Math.abs(t - edgeStart) < windowSize) glowBus.emit(source);
      // Glow target at edge end
      if (Math.abs(t - edgeEnd) < windowSize) glowBus.emit(target);
    });

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// ── Custom edge ───────────────────────────────────────────────────────────────
function IdleEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps & { data?: any }) {
  const isIdle = data?.isIdle ?? false;
  const isDone = data?.isDone ?? false;
  const offset = data?.offset ?? 0;
  const straight = data?.straight ?? false;
  const active = isIdle || isDone;

  const [edgePath] = straight
    ? getStraightPath({ sourceX, sourceY, targetX, targetY })
    : getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });

  const stroke = isDone ? "#22c55e" : isIdle ? "#f59e0b" : "#252525";
  // Each edge ball: delay = offset, duration = BALL_DUR, loop = TOTAL_LOOP
  // begin = "-Xs" to start mid-animation so they don't all start at 0
  const dur = `${TOTAL_LOOP}s`;
  // keyTimes: ball visible only during its slice of the total loop
  const startPct = (offset / TOTAL_LOOP).toFixed(4);
  const endPct = ((offset + BALL_DUR) / TOTAL_LOOP).toFixed(4);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke,
          strokeWidth: isDone ? 2 : 1,
          strokeDasharray: "5 5",
          opacity: isIdle ? 0.3 : isDone ? 0.9 : 0.12,
          transition: "opacity 0.5s, stroke 0.5s",
        }}
      />

      {active && (
        <>
          {/* Halo */}
          <circle r="12" fill={stroke} opacity="0">
            <animate
              attributeName="opacity"
              values={`0;0;0.08;0.08;0`}
              keyTimes={`0;${startPct};${+startPct + 0.01};${endPct};1`}
              dur={dur}
              repeatCount="indefinite"
            />
            <animateMotion dur={dur} repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
          {/* Mid */}
          <circle r="5" fill={stroke} opacity="0">
            <animate
              attributeName="opacity"
              values={`0;0;0.3;0.3;0`}
              keyTimes={`0;${startPct};${+startPct + 0.01};${endPct};1`}
              dur={dur}
              repeatCount="indefinite"
            />
            <animateMotion dur={dur} repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
          {/* Core */}
          <circle r="3" fill={stroke} opacity="0">
            <animate
              attributeName="opacity"
              values={`0;0;1;1;0`}
              keyTimes={`0;${startPct};${+startPct + 0.01};${endPct};1`}
              dur={dur}
              repeatCount="indefinite"
            />
            <animateMotion dur={dur} repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
        </>
      )}
    </>
  );
}

const edgeTypes = { idleEdge: IdleEdge };

// ── Terminal node ─────────────────────────────────────────────────────────────
function TerminalNode({ data }: { data: any }) {
  const { label, role, icon, status, msg, color, nodeId } = data;
  const [glowing, setGlowing] = useState(false);
  const glowTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = () => {
      setGlowing(true);
      clearTimeout(glowTimer.current);
      glowTimer.current = setTimeout(() => setGlowing(false), 500);
    };
    glowBus.on(nodeId, handler);
    return () => {
      glowBus.off(nodeId, handler);
      clearTimeout(glowTimer.current);
    };
  }, [nodeId]);

  const isActive = status === "active";
  const isDone = status === "done";
  const isError = status === "error";
  const isIdle = status === "idle";

  const borderColor = glowing
    ? "#f59e0b"
    : isActive
      ? color
      : isDone
        ? "#22c55e"
        : isError
          ? "#ef4444"
          : "#222";
  const accentColor = isActive
    ? color
    : isDone
      ? "#22c55e"
      : isError
        ? "#ef4444"
        : "#f59e0b";

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: accentColor, border: "none", width: 6, height: 6 }}
      />
      <div
        style={{
          width: NODE_W,
          minHeight: NODE_H,
          background: glowing ? "#110d00" : "#0a0a0a",
          border: `1px solid ${borderColor}`,
          borderRadius: 0,
          fontFamily: '"Courier New", monospace',
          overflow: "hidden",
          opacity: isIdle && !glowing ? 0.5 : 1,
          transition: "all 0.2s ease",
          boxShadow: glowing
            ? `0 0 0 1px #f59e0b60, 0 0 16px #f59e0b40, inset 0 0 10px #f59e0b10`
            : isActive
              ? `0 0 0 1px ${color}40`
              : isDone
                ? `0 0 0 1px #22c55e20`
                : "none",
        }}
      >
        <div
          style={{
            background: glowing
              ? "#180f00"
              : isIdle
                ? "#0f0f0f"
                : `${accentColor}12`,
            borderBottom: `1px solid ${borderColor}`,
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "background 0.2s",
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: glowing ? "#f5a623" : isIdle ? "#444" : accentColor,
              letterSpacing: "0.15em",
              fontWeight: 600,
            }}
          >
            {role}
          </span>
          <span
            style={{
              fontSize: 11,
              color: glowing ? "#f59e0b" : accentColor,
              display: "inline-block",
              animation: isIdle ? "rf-spin 4s linear infinite" : "none",
            }}
          >
            {icon}
          </span>
        </div>
        <div style={{ padding: "8px 10px" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: glowing ? "#f5c060" : isIdle ? "#333" : "#e0e0e0",
              transition: "color 0.2s",
            }}
          >
            {label.toUpperCase()}
          </div>
          {(!isIdle || glowing) && (
            <div
              style={{
                marginTop: 4,
                fontSize: 9,
                letterSpacing: "0.12em",
                color: glowing ? "#f59e0baa" : accentColor,
              }}
            >
              {glowing ? "[SIGNAL]" : `[${status.toUpperCase()}]`}
            </div>
          )}
          {msg && !glowing && (
            <div
              style={{
                marginTop: 4,
                fontSize: 9,
                color: "#555",
                whiteSpace: "normal",
                wordBreak: "break-word",
                lineHeight: 1.4,
                borderTop: "1px solid #1a1a1a",
                paddingTop: 4,
              }}
            >
              &gt; {msg}
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: accentColor, border: "none", width: 6, height: 6 }}
      />
    </>
  );
}

const nodeTypes: NodeTypes = { terminal: TerminalNode };

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AgentGraph({ events }: Props) {
  const agentStatus = useMemo(() => {
    const status: Record<string, "idle" | "active" | "done" | "error"> = {};
    events.forEach((e) => {
      status[e.node] = e.error ? "error" : "done";
    });
    const last = events[events.length - 1];
    // if (last && !last.approved && !last.error) status[last.node] = "active";
    if (last && status[last.node] !== "done" && status[last.node] !== "error") {
      status[last.node] = "active";
    }
    return status;
  }, [events]);

  const agentMsg = useMemo(() => {
    const msgs: Record<string, string> = {};
    events.forEach((e) => {
      msgs[e.node] = e.messages?.[0]?.slice(0, 45) ?? "";
    });
    return msgs;
  }, [events]);

  const isIdle = events.length === 0;
  const hasError = Object.values(agentStatus).some((s) => s === "error");
  const isRunning = Object.values(agentStatus).some((s) => s === "active");
  const isComplete = !isRunning && events.length > 0 && !hasError;

  // Start master glow timer when idle
  useEffect(() => {
    if (isIdle) {
      masterTimerStarted = false;
      startMasterTimer(true);
    }
  }, [isIdle]);

  const nodes = useMemo(
    () =>
      Object.entries(LAYOUT).map(([id, pos]) => {
        const s = agentStatus[id] ?? "idle";
        const meta = AGENT_META[id];
        const color =
          s === "done" ? "#22c55e" : s === "error" ? "#ef4444" : meta[s];
        return {
          id,
          type: "terminal",
          position: pos,
          width: NODE_W,
          height: NODE_H,
          data: {
            label: id.charAt(0).toUpperCase() + id.slice(1),
            role: meta.role,
            icon: meta.icon,
            status: s,
            msg: agentMsg[id] ?? "",
            color,
            nodeId: id,
          },
        };
      }),
    [agentStatus, agentMsg],
  );

  const styledEdges = useMemo(
    () =>
      EDGE_DEFS.map((e) => {
        const isDone =
          agentStatus[e.source] === "done" ||
          agentStatus[e.source] === "active";
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: "idleEdge",
          data: {
            isIdle,
            isDone,
            offset: e.offset,
            straight: e.straight,
            sourceNode: e.source,
            targetNode: e.target,
          },
          label: isDone ? "✓" : undefined,
          labelStyle: {
            fontFamily: "monospace",
            fontSize: 9,
            fill: "#22c55e",
            fontWeight: 600,
          },
          labelBgStyle: { fill: "#0a0a0a", fillOpacity: 0.9 },
        };
      }),
    [agentStatus, isIdle],
  );

  return (
    <>
      <style>{`
        @keyframes rf-spin  { to { transform: rotate(360deg); } }
        @keyframes rf-pulse { 0%,100%{opacity:.2} 50%{opacity:.9} }
      `}</style>
      <div
        style={{ fontFamily: '"Courier New", monospace' }}
        className="overflow-hidden border border-zinc-800 bg-black"
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 opacity-70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500 opacity-70" />
            <span className="w-3 h-3 rounded-full bg-green-600 opacity-70" />
            <span className="ml-3 text-xs text-zinc-500 tracking-widest uppercase">
              inference-path · agent-graph
            </span>
          </div>
          <span
            className="text-xs tracking-widest"
            style={{
              color: hasError ? "#ef4444" : isComplete ? "#22c55e" : "#f59e0b",
              animation: isIdle ? "rf-pulse 2s ease-in-out infinite" : "none",
            }}
          >
            {hasError
              ? "● ERR"
              : isComplete
                ? "● DONE"
                : isRunning
                  ? "● LIVE"
                  : "◌ IDLE"}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 px-5 py-3 border-b border-zinc-800 bg-black">
          {[
            { label: "EVENTS", val: events.length, color: "#22c55e" },
            {
              label: "ACTIVE",
              val: Object.values(agentStatus).filter((s) => s === "active")
                .length,
              color: "#f59e0b",
            },
            {
              label: "DONE",
              val: Object.values(agentStatus).filter((s) => s === "done")
                .length,
              color: "#22c55e",
            },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <p className="text-xs text-zinc-600 tracking-widest">{label}</p>
              <p className="text-base font-bold font-mono" style={{ color }}>
                {val}
              </p>
            </div>
          ))}
          <div className="ml-auto">
            <p className="text-xs text-zinc-600 tracking-widest">STATUS</p>
            <p
              className="text-base font-mono font-bold"
              style={{
                color: hasError
                  ? "#ef4444"
                  : isComplete
                    ? "#22c55e"
                    : isRunning
                      ? "#f59e0b"
                      : "#f59e0b",
              }}
            >
              {hasError
                ? "⚠ ERROR"
                : isComplete
                  ? "✓ COMPLETE"
                  : isRunning
                    ? "⟳ RUNNING"
                    : "— IDLE"}
            </p>
          </div>
          {isIdle && (
            <p
              className="text-xs text-zinc-700 tracking-widest ml-4 font-mono"
              style={{ animation: "rf-pulse 1.5s ease-in-out infinite" }}
            >
              awaiting orchestration events...
            </p>
          )}
        </div>

        {/* Graph — height 600px */}
        <div className="h-[600px]">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={styledEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              minZoom={0.4}
              maxZoom={2}
              nodesDraggable={false}
              nodesConnectable={false}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#111" gap={20} size={1} />
              <Controls position="bottom-left" showInteractive={false} />
              <MiniMap
                pannable
                zoomable
                position="bottom-right"
                maskColor="rgba(0,0,0,.85)"
                style={{
                  width: 130,
                  height: 85,
                  background: "#0a0a0a",
                  border: "1px solid #1f1f1f",
                  borderRadius: 0,
                }}
                nodeColor={(node) => {
                  const s = agentStatus[node.id] ?? "idle";
                  return s === "done"
                    ? "#22c55e"
                    : s === "active"
                      ? "#f59e0b"
                      : s === "error"
                        ? "#ef4444"
                        : "#1a1a1a";
                }}
              />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </>
  );
}
