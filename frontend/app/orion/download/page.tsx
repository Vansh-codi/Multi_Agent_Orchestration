export default function OrionDownloadPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold mb-4">⬡ Orion Desktop</h1>

        <p className="text-zinc-400 mb-8">
          Use Orion anywhere with Ctrl+Space.
        </p>

        <a
          href="/downloads/Orion Setup 1.0.0.exe"
          download
          className="px-5 py-3 rounded-lg border border-green-500/30"
        >
          Download for Windows
        </a>

        <div className="mt-8 text-sm text-zinc-500">
          Mac and Linux support coming later.
        </div>
      </div>
    </div>
  );
}
