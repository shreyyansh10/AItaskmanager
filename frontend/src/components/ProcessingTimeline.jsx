const STATUS_STYLES = {
  pending: {
    dot: 'bg-neutral-200 border-neutral-300',
    text: 'text-neutral-400',
    label: '',
  },
  active: {
    dot: 'bg-amber-400 border-amber-500 animate-pulse',
    text: 'text-black font-bold',
    label: 'text-amber-600',
  },
  done: {
    dot: 'bg-emerald-500 border-emerald-600',
    text: 'text-black',
    label: 'text-emerald-600',
  },
  error: {
    dot: 'bg-red-500 border-red-600',
    text: 'text-red-600 font-bold',
    label: 'text-red-500',
  },
}

export default function ProcessingTimeline({ stages }) {
  if (!stages || stages.length === 0) return null

  return (
    <div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] p-5">
      <h2 className="text-sm font-black text-black mb-4 uppercase tracking-wider">
        Processing Pipeline
      </h2>

      <ol className="relative">
        {stages.map((stage, i) => {
          const style = STATUS_STYLES[stage.status] || STATUS_STYLES.pending
          const isLast = i === stages.length - 1

          return (
            <li key={stage.name} className="flex items-start gap-4">
              {/* Connector line + dot */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 mt-0.5 shrink-0 ${style.dot}`} />
                {!isLast && <div className="w-0.5 bg-neutral-200 flex-1 my-1 min-h-[20px]" />}
              </div>

              {/* Stage label */}
              <div className="pb-4">
                <span className={`text-sm ${style.text}`}>{stage.name}</span>
                {stage.status === 'active' && (
                  <span className={`ml-2 text-xs ${style.label}`}>Running…</span>
                )}
                {stage.status === 'done' && (
                  <span className={`ml-2 text-xs ${style.label}`}>✓</span>
                )}
                {stage.status === 'error' && (
                  <span className={`ml-2 text-xs ${style.label}`}>✗ Failed</span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
