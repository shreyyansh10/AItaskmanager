const STATUS_STYLES = {
  pending: {
    dot: 'bg-neutral-200 border-neutral-300',
    text: 'text-neutral-400',
    icon: null,
  },
  active: {
    dot: 'bg-amber-400 border-amber-500',
    text: 'text-black font-bold',
    icon: 'spinner',
  },
  done: {
    dot: 'bg-emerald-500 border-emerald-600',
    text: 'text-black',
    icon: 'check',
  },
  error: {
    dot: 'bg-red-500 border-red-600',
    text: 'text-red-600 font-bold',
    icon: 'x',
  },
}

function StageIcon({ type }) {
  if (type === 'spinner') {
    return (
      <svg className="w-3 h-3 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    )
  }
  if (type === 'check') {
    return <span className="text-emerald-500 text-xs font-black">✓</span>
  }
  if (type === 'x') {
    return <span className="text-red-500 text-xs font-black">✗</span>
  }
  return null
}

export default function ProcessingTimeline({ stages, visible }) {
  if (!visible) return null

  const hasError = stages.some((s) => s.status === 'error')

  return (
    /* Full-screen backdrop — blocks all interaction behind it */
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>

      <div className="bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_#000] w-full max-w-sm p-7 animate-[fadeInScale_0.2s_ease-out]">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            {!hasError && (
              <svg className="w-4 h-4 animate-spin text-black shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            <h2 className="text-base font-black text-black tracking-tight">
              {hasError ? 'Generation Failed' : 'Generating Tasks'}
            </h2>
          </div>
          <p className="text-xs text-neutral-400 font-medium pl-7">
            {hasError ? 'An error occurred during processing.' : 'AI is extracting tasks from your notes…'}
          </p>
        </div>

        {/* Stage list */}
        <ol>
          {stages.map((stage, i) => {
            const style = STATUS_STYLES[stage.status] || STATUS_STYLES.pending
            const isLast = i === stages.length - 1
            return (
              <li key={stage.name} className="flex items-start gap-3">
                {/* Dot + connector */}
                <div className="flex flex-col items-center pt-0.5">
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 transition-colors duration-300 ${style.dot}`} />
                  {!isLast && <div className="w-px bg-neutral-200 flex-1 my-1 min-h-[16px]" />}
                </div>

                {/* Label + icon */}
                <div className="flex items-center gap-2 pb-3">
                  <span className={`text-sm transition-colors duration-300 ${style.text}`}>
                    {stage.name}
                  </span>
                  <StageIcon type={style.icon} />
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
