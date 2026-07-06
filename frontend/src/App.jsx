import { useState, useCallback } from 'react'
import Navbar from './components/Navbar'
import InputSection from './components/InputSection'
import UploadArea from './components/UploadArea'
import GenerateButton from './components/GenerateButton'
import ProcessingTimeline from './components/ProcessingTimeline'
import SummaryCards from './components/SummaryCards'
import FilterBar from './components/FilterBar'
import TaskTable from './components/TaskTable'
import TaskEditModal from './components/TaskEditModal'
import JsonViewer from './components/JsonViewer'
import { useTaskGeneration } from './hooks/useTaskGeneration'
import { useTasks } from './hooks/useTasks'

export default function App() {
  // ── Input state ──────────────────────────────────────────────
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)

  // ── Workflow visibility state ────────────────────────────────
  const [showTimeline, setShowTimeline] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [crudError, setCrudError] = useState(null)

  // ── Task CRUD + filter hook ──────────────────────────────────
  const {
    tasks,
    filters,
    setFilters,
    updateTask,
    deleteTask,
    reloadTasks,
    exportJson,
    fetchError,
  } = useTasks()

  // ── Generation hook ──────────────────────────────────────────
  const onCompleted = useCallback(() => {
    // Source of truth is the database — refetch after pipeline completes
    reloadTasks()
    setShowTimeline(false)
    setHasGenerated(true)
  }, [reloadTasks])

  const onError = useCallback(() => {
    setShowTimeline(false)
  }, [])

  const { stages, isGenerating, generateError, generate } = useTaskGeneration({
    onCompleted,
    onError,
  })

  // ── Input handlers ───────────────────────────────────────────
  function handleTextChange(value) {
    setText(value)
    if (value) setFile(null)
  }

  function handleFileSelect(selectedFile) {
    setFile(selectedFile)
    setText('')
  }

  // ── Generate ─────────────────────────────────────────────────
  function handleGenerate() {
    setShowTimeline(true)
    setHasGenerated(false)
    generate({ text, file })
  }

  // ── CRUD handlers ────────────────────────────────────────────
  async function handleEditSave(updatedTask) {
    setCrudError(null)
    try {
      await updateTask(updatedTask.id, {
        title: updatedTask.title,
        description: updatedTask.description,
        owner: updatedTask.owner,
        due_date: updatedTask.due_date,
        priority: updatedTask.priority,
        status: updatedTask.status,
      })
      setEditingTask(null)
    } catch (err) {
      setCrudError(err.message)
    }
  }

  async function handleDelete(taskId) {
    setCrudError(null)
    try {
      await deleteTask(taskId)
    } catch (err) {
      setCrudError(err.message)
    }
  }

  const hasInput = text.trim().length > 0 || file !== null
  const activeError = generateError || fetchError || crudError

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* ── Error Banner ──────────────────────────────────── */}
        {activeError && (
          <div className="flex items-start justify-between gap-4 bg-white border-2 border-red-400 rounded-xl shadow-[4px_4px_0px_#f87171] px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="text-red-500 font-black text-base leading-none mt-0.5">✕</span>
              <p className="text-sm font-bold text-red-600">{activeError}</p>
            </div>
            <button
              onClick={() => { setCrudError(null) }}
              className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Input Section ─────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-black text-black">Generate Tasks</h2>
            <p className="text-sm text-neutral-500 font-medium mt-0.5">
              Paste notes or upload a file — AI extracts structured tasks automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InputSection value={text} onChange={handleTextChange} />
            <UploadArea
              file={file}
              onFileSelect={handleFileSelect}
              onClear={() => setFile(null)}
            />
          </div>

          {(text || file) && (
            <p className="text-xs text-neutral-400 font-medium">
              {file
                ? '📎 File selected — text input is cleared.'
                : '✏️ Text entered — file upload is cleared.'}
            </p>
          )}

          <GenerateButton
            hasInput={hasInput}
            isLoading={isGenerating}
            onGenerate={handleGenerate}
          />
        </section>

        {/* ── Processing Timeline ────────────────────────────── */}
        {showTimeline && (
          <section className="transition-opacity duration-300 opacity-100">
            <ProcessingTimeline stages={stages} />
          </section>
        )}

        {/* ── Empty state ────────────────────────────────────── */}
        {!showTimeline && !hasGenerated && (
          <section className="py-16 text-center">
            <div className="inline-flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl border-2 border-neutral-300 bg-white shadow-[2px_2px_0px_#d4d4d4] flex items-center justify-center">
                <svg className="w-6 h-6 text-neutral-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-bold text-neutral-400">No tasks generated yet.</p>
              <p className="text-xs text-neutral-400 font-medium">
                Paste meeting notes or upload a document to begin.
              </p>
            </div>
          </section>
        )}

        {/* ── Results — revealed only after generation completes */}
        {hasGenerated && (
          <div className="space-y-8">

            {/* Summary Cards */}
            <section className="space-y-3">
              <h2 className="text-base font-black text-black uppercase tracking-wider">Summary</h2>
              <SummaryCards tasks={tasks} />
            </section>

            {/* Filter Bar + Task Table */}
            <section className="space-y-3">
              <h2 className="text-base font-black text-black uppercase tracking-wider">
                Tasks
                <span className="ml-2 text-sm font-bold text-neutral-400 normal-case">
                  {tasks.length} total
                </span>
              </h2>
              <FilterBar
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={() => setFilters({ owner: '', priority: '', status: '' })}
              />
              <TaskTable
                tasks={tasks}
                onEdit={setEditingTask}
                onDelete={handleDelete}
              />
            </section>

            {/* JSON Viewer — Download delegates to backend export endpoint */}
            <section>
              <JsonViewer tasks={tasks} onExport={exportJson} />
            </section>

          </div>
        )}
      </main>

      {/* Edit Modal */}
      <TaskEditModal
        task={editingTask}
        onSave={handleEditSave}
        onClose={() => setEditingTask(null)}
      />
    </div>
  )
}
