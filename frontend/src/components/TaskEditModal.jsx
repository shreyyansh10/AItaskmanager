import { useState, useEffect } from 'react'

const PRIORITIES = ['High', 'Medium', 'Low']
const STATUSES = ['Pending', 'In Progress', 'Done']

export default function TaskEditModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    owner: '',
    due_date: '',
    priority: 'Medium',
    status: 'Pending',
  })

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        owner: task.owner || '',
        due_date: task.due_date || '',
        priority: task.priority || 'Medium',
        status: task.status || 'Pending',
      })
    }
  }, [task])

  if (!task) return null

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...task, ...form })
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border-2 border-black rounded-xl shadow-[6px_6px_0px_#000] w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black px-6 py-4">
          <h2 className="text-base font-black text-black">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black transition-colors font-bold text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Field label="Title" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
              className="input-base"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="input-base resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Owner">
              <input
                type="text"
                value={form.owner}
                onChange={(e) => set('owner', e.target.value)}
                className="input-base"
              />
            </Field>
            <Field label="Due Date">
              <input
                type="text"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
                placeholder="e.g. 2025-12-31"
                className="input-base"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority">
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                className="input-base"
              >
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="input-base"
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-bold border-2 border-black rounded-lg px-4 py-2 bg-white hover:bg-[#F5F5F5] shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm font-bold border-2 border-black rounded-lg px-4 py-2 bg-black text-white shadow-[2px_2px_0px_#525252] hover:shadow-[4px_4px_0px_#525252] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {/* Inject shared input styles via className on children */}
      <div className="[&_.input-base]:w-full [&_.input-base]:border-2 [&_.input-base]:border-black [&_.input-base]:rounded-lg [&_.input-base]:px-3 [&_.input-base]:py-2 [&_.input-base]:text-sm [&_.input-base]:font-medium [&_.input-base]:bg-[#F5F5F5] [&_.input-base]:text-black [&_.input-base]:focus:outline-none [&_.input-base]:focus:bg-white [&_.input-base]:transition-colors">
        {children}
      </div>
    </div>
  )
}
