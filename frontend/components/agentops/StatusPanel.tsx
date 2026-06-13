"use client";

const systems = [
  {
    name: "Docker Sandbox",
    status: "healthy",
  },
  {
    name: "Redis Pub/Sub",
    status: "healthy",
  },
  {
    name: "RAG Database",
    status: "healthy",
  },
  {
    name: "Groq API",
    status: "healthy",
  },
];

export default function StatusPanel() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {systems.map((system) => (
        <div
          key={system.name}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
        >
          <div className="flex items-center justify-between">
            <span>{system.name}</span>

            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>
      ))}
    </div>
  );
}
