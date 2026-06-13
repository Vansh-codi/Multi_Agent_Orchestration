// "use client";

// import { motion } from "framer-motion";

// const statuses = [
//   "Docker: Running",
//   "Redis: Connected",
//   "RAG: Indexed",
//   "WebSocket: Live",
//   "Groq: Active",
// ];

// export default function Hero() {
//   return (
//     <section className="relative border-b border-zinc-800 overflow-hidden">
//       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),transparent_60%)]" />

//       <div className="relative px-8 py-12">
//         <motion.h1
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="text-5xl font-bold tracking-tight"
//         >
//           Multi-Agent AI working for you
//         </motion.h1>

//         <p className="text-zinc-400 mt-4 max-w-2xl">
//           Real-time orchestration, execution transparency, multimodal ingestion,
//           infrastructure monitoring, and autonomous workflows.
//         </p>

//         <div className="flex flex-wrap gap-3 mt-8">
//           {statuses.map((status) => (
//             <div
//               key={status}
//               className="px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 text-sm"
//             >
//               {status}
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const statuses = [
  { label: "Docker", value: "Running", mode: "center" },
  { label: "Redis", value: "Connected", mode: "random" },
  { label: "RAG", value: "Indexed", mode: "pulse" },
  { label: "WebSocket", value: "Live", mode: "right" },
  { label: "Groq", value: "Active", mode: "left" },
];

function AnimatedStatusWord({
  word,
  active,
  mode,
}: {
  word: string;
  active: boolean;
  mode: string;
}) {
  const center = Math.floor(word.length / 2);
  return (
    <span className="inline-flex">
      {word.split("").map((char, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={false}
          animate={
            active
              ? {
                  color: ["#ffffff", "#FCD34D", "#ffffff"],

                  textShadow: [
                    "0 0 0px rgba(252,211,77,0)",
                    "0 0 18px rgba(252,211,77,.95)",
                    "0 0 0px rgba(252,211,77,0)",
                  ],
                }
              : {
                  y: 0,
                  opacity: 1,
                  color: "#ffffff",
                  textShadow: "0 0 0px transparent",
                }
          }
          transition={{
            duration: 1.6,
            delay: (() => {
              let delay = index * 0.28;

              if (mode === "center") {
                delay = Math.abs(index - center) * 0.28;
              }

              if (mode === "right") {
                delay = (word.length - index) * 0.28;
              }

              if (mode === "random") {
                const pattern = [2, 0, 3, 1, 4, 5, 6, 7];
                delay = (pattern[index] ?? index) * 0.22;
              }

              if (mode === "pulse") {
                delay = Math.abs(index - center) * 0.18;
              }

              return delay;
            })(),
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

export default function Hero() {
  const [activeStatus, setActiveStatus] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStatus((prev) => (prev + 1) % statuses.length);
    }, 5200);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-zinc-800">
      {/* Animated Neon Glow */}
      <motion.div
        animate={{
          opacity: [0.45, 0.7, 0.45],
          scale: [1, 1.06, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.18),transparent_65%)]
        "
      />

      {/* Grid Overlay */}
      <div
        className="
          absolute
          inset-0
          bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),
          linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]
          bg-[size:48px_48px]
        "
      />

      <div className="relative px-8 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="
            text-3xl
            md:text-4xl
            font-bold
            tracking-tight
            text-white
          "
        >
          Multi-Agent AI working for you
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: 0.08,
          }}
          className="
            mt-3
            max-w-3xl
            text-zinc-400
            leading-relaxed
          "
        >
          Real-time orchestration, execution transparency, multimodal ingestion,
          infrastructure monitoring, and autonomous workflows.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 0.2,
          }}
          className="flex flex-wrap gap-3 mt-8"
        >
          {statuses.map((status, index) => (
            <motion.div
              key={status.label}
              whileHover={{
                y: -2,
                scale: 1.02,
              }}
              className="
                flex
                items-center
                gap-2
                px-4
                py-2
                rounded-full
                border
                border-green-500/30
                bg-green-500/10
                backdrop-blur-md
                text-sm
              "
            >
              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-green-500
                  shadow-[0_0_10px_rgba(34,197,94,0.9)]
                "
              />

              <span className="text-zinc-200">{status.label}:</span>

              <AnimatedStatusWord
                word={status.value}
                active={activeStatus === index}
                mode={status.mode}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
    /* <style jsx>{`
        .energy-flow {
          background: linear-gradient(
            90deg,
            #ffffff 0%,
            #ffffff 35%,
            #fcd34d 50%,
            #ffffff 65%,
            #ffffff 100%
          );

          background-size: 300% 100%;

          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;

          animation: energyFlow 2s linear infinite;
        }

        @keyframes energyFlow {
          0% {
            background-position: 200% center;
          }

          100% {
            background-position: -200% center;
          }
        }
      `}</style> */
  );
}
