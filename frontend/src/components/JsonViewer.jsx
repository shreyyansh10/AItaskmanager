import { useState } from 'react'

// Minimal syntax highlighting — colors keys, strings, numbers, booleans
function colorize(json) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-blue-600'          // number
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'text-black font-semibold' : 'text-emerald-700'
        } else if (/true|false/.test(match)) {
          cls = 'text-amber-600'
        } else if (/null/.test(match)) {
          cls = 'text-neutral-400'
        }
        return `<span class="${cls}">${match}</span>`
      }
    )
}

export default function JsonViewer({ tasks, onExport }) {
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  const json = JSON.stringify(tasks, null, 2)

  function handleCopy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    if (onExport) { onExport(); return }
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tasks.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] flex flex-col h-full overflow-hidden">
      {/* Header — always visible */}
      <div className="flex items-center justify-between border-b-2 border-black px-4 py-3 shrink-0">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 text-sm font-black text-black hover:text-neutral-600 transition-colors"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`}
            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span>JSON</span>
          <span className="text-xs font-bold text-neutral-400 normal-case">
            {tasks.length} tasks
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="text-xs font-bold border-2 border-black rounded-lg px-2.5 py-1 bg-white hover:bg-[#F5F5F5] shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] transition-all"
          >
            {copied ? '✓' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="text-xs font-bold border-2 border-black rounded-lg px-2.5 py-1 bg-black text-white shadow-[2px_2px_0px_#525252] hover:shadow-[4px_4px_0px_#525252] hover:-translate-x-px hover:-translate-y-px transition-all"
          >
            ↓ Download
          </button>
        </div>
      </div>

      {/* Scrollable JSON body — fills remaining height */}
      {!collapsed && (
        <pre
          className="flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed bg-[#F5F5F5] text-black"
          dangerouslySetInnerHTML={{ __html: colorize(json) }}
        />
      )}

      {collapsed && (
        <div className="flex-1 flex items-center justify-center text-xs text-neutral-400 font-medium py-6">
          Click to expand JSON output
        </div>
      )}
    </div>
  )
}
