import { useState, useEffect } from 'react'

function App() {
  const [count, setCount] = useState(0)
  const [backendStatus, setBackendStatus] = useState('connecting')

  useEffect(() => {
    // Simple fetch to see if the FastAPI server is running
    fetch('http://localhost:8000/health')
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error('Response not OK')
      })
      .then((data) => {
        if (data.status === 'ok') {
          setBackendStatus('connected')
        } else {
          setBackendStatus('error')
        }
      })
      .catch(() => {
        setBackendStatus('disconnected')
      })
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative background glow circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -z-10 animate-pulse delay-1000"></div>

      <div className="max-w-xl w-full backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:shadow-blue-500/5">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            Phase 1 Scaffolding
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            AI Task Manager
          </h1>
          <p className="mt-2 text-slate-400">
            Frontend and backend environment successfully initialized.
          </p>
        </div>

        {/* Project Status Panel */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-sm font-medium text-slate-300">Frontend (Vite + React)</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-sm font-medium text-slate-300">Tailwind CSS (v4)</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Styled
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-sm font-medium text-slate-300">Backend Connection</span>
            {backendStatus === 'connecting' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                Connecting...
              </span>
            )}
            {backendStatus === 'connected' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            )}
            {backendStatus === 'disconnected' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Disconnected
              </span>
            )}
            {backendStatus === 'error' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Error
              </span>
            )}
          </div>
        </div>

        {/* Counter Action */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center">
          <p className="text-sm text-slate-400 mb-3">Verify React State Logic:</p>
          <button
            onClick={() => setCount((c) => c + 1)}
            className="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-95 transition-all duration-200"
          >
            Count is: {count}
          </button>
        </div>

      </div>

      <footer className="mt-8 text-center text-xs text-slate-600">
        AI Task Manager &copy; 2026. Built with FastAPI & Vite React.
      </footer>
    </div>
  )
}

export default App
