// ═══════════════════════════════════════════════════════════════
//  USERS TABLE (shared)
// ═══════════════════════════════════════════════════════════════
// import { PlanType, User, UserStatus } from "./adminTypes";
import { AdminUser, PlanType, UserStatus } from "./adminTypes";
export default function UsersTable({
  rows,
  compact = false,
}: {
  rows: AdminUser[];
  compact?: boolean;
}) {
  const planVariant: Record<PlanType, "green" | "amber" | "gray"> = {
    Pro: "green",
    Team: "amber",
    Free: "gray",
  };
  const statusVariant: Record<UserStatus, "green" | "amber" | "red"> = {
    Active: "green",
    Idle: "amber",
    Suspended: "red",
  };
  const dotColor: Record<UserStatus, "green" | "amber" | "red"> = {
    Active: "green",
    Idle: "amber",
    Suspended: "red",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/[0.05]">
            {[
              "Email",
              "Plan",
              "Runs",
              "Tokens",
              "Last Active",
              "Status",
              "",
            ].map((h) => (
              <th
                key={h}
                className="whitespace-nowrap pb-2.5 pr-6 font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((u, i) => (
            <tr
              key={i}
              className="group border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] cursor-pointer"
            >
              <td className="py-2.5 pr-6">
                <span className="text-[12px] font-medium text-neutral-300">
                  {u.email}
                </span>
              </td>
              <td className="py-2.5 pr-6">
                {/* <Badge label={u.plan} variant={planVariant[u.plan]} /> */}
              </td>
              <td className="py-2.5 pr-6 font-mono text-[11px] text-neutral-500">
                {/* {u.runs.toLocaleString()} */}
                {u.name}
              </td>
              <td className="py-2.5 pr-6 font-mono text-[11px] text-neutral-500">
                {/* {u.tokens} */}
                {u.email}
              </td>
              <td className="py-2.5 pr-6 font-mono text-[11px] text-neutral-600">
                {u.role}
                {/* {u.lastActive} */}
              </td>
              <td className="py-2.5 pr-6">
                <div className="flex items-center gap-1.5">
                  {new Date(u.created_at).toLocaleDateString()}
                  {/* <Dot status={dotColor[u.status]} /> */}
                  {/* <Badge label={u.status} variant={statusVariant[u.status]} /> */}
                </div>
              </td>
              <td className="py-2.5 text-right">
                {!compact && (
                  <button className="rounded border border-white/[0.06] bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-neutral-300">
                    Manage
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
