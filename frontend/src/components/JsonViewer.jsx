import { useState } from 'react'

// onExport: optional callback — when provided, the Download button calls it
// (used in production to hit GET /tasks/export/json on the backend).
// Falls back to a client-side Blob download when not provided.
export default function JsonViewer({ tasks, onExport }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const json = JSON.stringify(tasks, null, 2)

  function handleCopy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    if (onExport) {
      onExport()
      return
    }
    // Fallback: client-side Blob (used when no backend export endpoint available)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tasks.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between border-b-2 border-black px-5 py-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-black text-black hover:text-neutral-600 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          JSON Output
          <span className="text-xs font-bold text-neutral-400">({tasks.length} tasks)</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-xs font-bold border-2 border-black rounded-lg px-3 py-1 bg-white hover:bg-[#F5F5F5] shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] transition-all"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="text-xs font-bold border-2 border-black rounded-lg px-3 py-1 bg-black text-white shadow-[2px_2px_0px_#525252] hover:shadow-[4px_4px_0px_#525252] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
          >
            Download tasks.json
          </button>
        </div>
      </div>

      {/* Collapsible JSON block */}
      {open && (
        <pre className="overflow-x-auto p-5 text-xs text-black bg-[#F5F5F5] font-mono leading-relaxed max-h-96">
          {json}
        </pre>
      )}
    </div>
  )
}
