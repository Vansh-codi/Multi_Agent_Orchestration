// // frontend/app/layout.tsx
// import type { Metadata } from "next";

// export const metadata: Metadata = {
//   title: "AgentOps — Multi-Agent Task Runner",
//   description: "Give a goal, watch agents work in real time.",
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body style={{ margin: 0, padding: 0 }}>{children}</body>
//     </html>
//   );
// }

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentOps",
  description: "Multi-Agent Orchestration Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white antialiased">{children}</body>
    </html>
  );
}
