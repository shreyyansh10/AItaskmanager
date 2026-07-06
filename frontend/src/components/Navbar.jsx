export default function Navbar() {
  return (
    <header className="w-full bg-white border-b-2 border-black">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-black">T</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-black tracking-tight leading-none">
              TaskPilot AI
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              AI-powered task extraction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black text-xs font-bold bg-white text-black shadow-[2px_2px_0px_#000]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            API Connected
          </span>
        </div>
      </div>
    </header>
  )
}
