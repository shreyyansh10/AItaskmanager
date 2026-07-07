import { useState, useCallback, useRef } from 'react'
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

  // ── Workflow state ───────────────────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [crudError, setCrudError] = useState(null)

  // Ref to scroll results into view after generation
  const resultsRef = useRef(null)
  const submittedSourceTextRef = useRef('')

  // ── Task CRUD + filter hook ──────────────────────────────────
  const {
    tasks,
    filters,
    setFilters,
    updateTask,
    deleteTask,
    setCurrentTasks,
    reloadTasks,
    reloadTasksForSourceText,
    exportJson,
    fetchError,
  } = useTasks()

  // ── Generation hook ──────────────────────────────────────────
  const onCompleted = useCallback((newTasks) => {
    if (newTasks && newTasks.length > 0) {
      // Show only the tasks produced by this generation run
      setCurrentTasks(newTasks)
    } else if (submittedSourceTextRef.current) {
      // Fallback for completions that do not carry task payloads: reload only
      // the rows that belong to the submitted source text.
      reloadTasksForSourceText(submittedSourceTextRef.current)
    } else {
      // already_processed or empty result — reload from DB
      reloadTasks()
    }
    setShowModal(false)
    setHasGenerated(true)
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }, [reloadTasks, reloadTasksForSourceText, setCurrentTasks])

  const onError = useCallback(() => {
    setShowModal(false)
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
    submittedSourceTextRef.current = text.trim()
    setShowModal(true)
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

      {/* Processing modal — rendered at root level, always centered */}
      <ProcessingTimeline stages={stages} visible={showModal} />

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-7">

        {/* ── Error Banner ──────────────────────────────────── */}
        {activeError && (
          <div className="flex items-start justify-between gap-4 bg-white border-2 border-red-400 rounded-xl shadow-[4px_4px_0px_#f87171] px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="text-red-500 font-black text-base leading-none mt-0.5">✕</span>
              <p className="text-sm font-bold text-red-600">{activeError}</p>
            </div>
            <button
              onClick={() => setCrudError(null)}
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
              Paste meeting notes or upload a file — AI extracts structured tasks automatically.
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

        {/* ── Empty state ────────────────────────────────────── */}
        {!hasGenerated && (
          <section className="py-14 text-center">
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

        {/* ── Results ───────────────────────────────────────── */}
        {hasGenerated && (
          <div ref={resultsRef} className="space-y-5">

            {/* Summary Cards */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-black uppercase tracking-wider">Summary</h2>
              <SummaryCards tasks={tasks} />
            </section>

            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={() => setFilters({ owner: '', priority: '', status: '' })}
            />

            {/* Task Table + JSON side by side */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-black uppercase tracking-wider">
                  Tasks
                  <span className="ml-2 text-sm font-bold text-neutral-400 normal-case">
                    {tasks.length} total
                  </span>
                </h2>
              </div>

              {/* Side-by-side: table 65% / JSON 35% on large screens, stacked on tablet/mobile */}
              <div className="flex flex-col xl:flex-row gap-4 items-start">

                {/* Task Table — 65% */}
                <div className="w-full xl:w-[65%] min-w-0">
                  <TaskTable
                    tasks={tasks}
                    onEdit={setEditingTask}
                    onDelete={handleDelete}
                  />
                </div>

                {/* JSON Viewer — 35%, fixed height matching table */}
                <div className="w-full xl:w-[35%] xl:sticky xl:top-4" style={{ height: '560px' }}>
                  <JsonViewer tasks={tasks} onExport={exportJson} />
                </div>

              </div>
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
