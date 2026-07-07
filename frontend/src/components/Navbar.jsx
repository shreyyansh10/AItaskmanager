export default function Navbar() {
  return (
    <header className="w-full bg-white border-b-2 border-black">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white text-base font-black">T</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-black tracking-tight leading-none">
              TaskPilot
            </h1>
            <p className="text-xs text-neutral-400 font-medium mt-0.5">
              Turn meeting notes into structured tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-black text-xs font-bold bg-white text-black shadow-[2px_2px_0px_#000]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            AI Ready
          </span>
        </div>
      </div>
    </header>
  )
}
