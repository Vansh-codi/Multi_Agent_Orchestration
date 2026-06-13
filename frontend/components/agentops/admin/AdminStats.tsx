import { motion } from "framer-motion";
import { fadeUp } from "./animation";
// ═══════════════════════════════════════════════════════════════
//  WEEK CHART
// ═══════════════════════════════════════════════════════════════
type WeekPoint = {
  day: string;
  runs: number;
};

export function WeekChart({ data }: { data: WeekPoint[] }) {
  const max = Math.max(...data.map((d) => Number(d.runs)), 1);

  return (
    <div>
      <div className="flex items-end gap-2 h-80">
        {data.map((d, i) => {
          return (
            <div
              key={i}
              className="group flex-1 flex flex-col justify-end cursor-default"
            >
              <div className="group relative flex flex-1 flex-col justify-end h-full">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{
                    height: `${Math.max((Number(d.runs) / max) * 180, 15)}px`,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.06,
                    ease: "easeOut",
                  }}
                  className={`w-full rounded-sm transition-colors ${
                    i === data.length - 1
                      ? "bg-green-500"
                      : "bg-white/30 hover:bg-white/50"
                  }`}
                />

                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded border border-white/[0.08] bg-[#0c0c0c] px-2 py-1 font-mono text-[10px] text-neutral-300 shadow-xl">
                  {Number(d.runs).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-between">
        {data.map((d) => (
          <span
            key={d.day}
            className="flex-1 text-center font-mono text-[9px] text-neutral-700"
          >
            {d.day}
          </span>
        ))}
      </div>
    </div>
  );
}
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  accent?: "green" | "blue" | "amber" | "red";
  delay?: number;
  icon?: string;
}

export default function StatCard({
  label,
  value,
  sub,
  trend,
  accent = "green",
  delay = 0,
  icon,
}: StatCardProps) {
  const bar = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  }[accent];
  const trendColor =
    trend === "up"
      ? "text-green-400"
      : trend === "down"
        ? "text-red-400"
        : "text-neutral-500";

  return (
    <motion.div
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0c] p-4 transition-all duration-200 hover:border-white/[0.1] hover:bg-[#0f1a0f]"
    >
      <div className={`absolute inset-x-0 top-0 h-px ${bar} opacity-60`} />
      <div className="flex items-start justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-600">
          {label}
        </p>
        {icon && <span className="text-base opacity-40">{icon}</span>}
      </div>
      <p className="mt-2 font-['JetBrains_Mono',monospace] text-[26px] font-semibold leading-none tracking-tight text-white">
        {value}
      </p>
      {sub && (
        <p className={`mt-1.5 font-mono text-[10px] ${trendColor}`}>{sub}</p>
      )}
    </motion.div>
  );
}
