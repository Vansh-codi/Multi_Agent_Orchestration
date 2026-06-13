export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-600">
      {children}
    </p>
  );
}

export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/[0.06] bg-[#181f22] ${className}`}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  STAT CARD
// ═══════════════════════════════════════════════════════════════

export function Badge({
  label,
  variant = "gray",
}: {
  label: string;
  variant?: "green" | "blue" | "amber" | "red" | "purple" | "gray";
}) {
  const cls = {
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    blue: "bg-blue-500/10   text-blue-400   border-blue-500/20",
    amber: "bg-amber-500/10  text-amber-400  border-amber-500/20",
    red: "bg-red-500/10    text-red-400    border-red-500/20",
    purple: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    gray: "bg-white/[0.05]  text-neutral-400 border-white/[0.08]",
  }[variant];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium ${cls}`}
    >
      {label}
    </span>
  );
}
export function Dot({
  status,
}: {
  status: "green" | "amber" | "red" | "blue";
}) {
  const cls = {
    green: "bg-green-400",
    amber: "bg-amber-400",
    red: "bg-red-400",
    blue: "bg-blue-400",
  }[status];
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cls} opacity-40`}
      />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${cls}`} />
    </span>
  );
}
