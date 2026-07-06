export default function GenerateButton({ hasInput, isLoading, onGenerate }) {
  const disabled = !hasInput || isLoading

  return (
    <button
      onClick={onGenerate}
      disabled={disabled}
      className={`w-full py-3.5 rounded-xl border-2 border-black font-black text-sm tracking-wide transition-all
        ${disabled
          ? 'bg-neutral-100 text-neutral-400 border-neutral-300 cursor-not-allowed shadow-none'
          : 'bg-black text-white shadow-[4px_4px_0px_#525252] hover:shadow-[6px_6px_0px_#525252] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[2px_2px_0px_#525252] active:translate-x-[1px] active:translate-y-[1px]'
        }`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Generating Tasks...
        </span>
      ) : (
        'Generate Tasks with AI'
      )}
    </button>
  )
}
