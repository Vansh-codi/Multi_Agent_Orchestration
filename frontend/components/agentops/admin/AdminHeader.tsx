import { motion } from "framer-motion";
import { Dot } from "./AdminCard";

export default function AdminHeader() {
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      className="flex flex-shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#090e09]/80 backdrop-blur-md px-6"
      style={{ height: 52 }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-semibold tracking-tight text-white">
          Admin Panel
        </h1>
        <span className="rounded-full border border-red-500/20 bg-red-500/[0.08] px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-red-400">
          Admin Only
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] text-neutral-600">
          <Dot status="green" />
          All systems operational
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5 font-mono text-[10px] text-amber-500">
          <Dot status="amber" />2 alerts
        </div>
      </div>
    </motion.header>
  );
}
