const PRIORITY_BADGE = {
  High:   'bg-red-50 text-red-700 border-red-300',
  Medium: 'bg-amber-50 text-amber-700 border-amber-300',
  Low:    'bg-emerald-50 text-emerald-700 border-emerald-300',
}

const STATUS_BADGE = {
  Pending:       'bg-neutral-100 text-neutral-600 border-neutral-300',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-300',
  Done:          'bg-emerald-50 text-emerald-700 border-emerald-300',
}

function Badge({ value, map }) {
  const cls = map[value] || 'bg-neutral-100 text-neutral-600 border-neutral-300'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-bold whitespace-nowrap ${cls}`}>
      {value}
    </span>
  )
}

function OwnerCell({ owner }) {
  if (!owner || owner === 'Unassigned') {
    return <span className="text-neutral-400 text-sm">—</span>
  }
  const initials = owner.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center shrink-0">
        {initials}
      </div>
      <span className="text-sm text-neutral-700 font-medium whitespace-nowrap">{owner}</span>
    </div>
  )
}

export default function TaskTable({ tasks, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] p-12 text-center">
        <p className="text-sm font-bold text-neutral-400">No tasks match the current filters.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] overflow-hidden">
      <div className="overflow-auto max-h-[520px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b-2 border-black bg-[#F5F5F5]">
              {['Title', 'Owner', 'Priority', 'Status', 'Due Date', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-black text-black uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => (
              <tr
                key={task.id ?? i}
                className="border-b border-neutral-100 hover:bg-[#FAFAFA] transition-colors"
              >
                <td className="px-4 py-3.5 font-medium text-black max-w-[280px]">
                  <p className="truncate leading-snug">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-neutral-400 truncate mt-0.5 font-normal">
                      {task.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <OwnerCell owner={task.owner} />
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <Badge value={task.priority} map={PRIORITY_BADGE} />
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <Badge value={task.status} map={STATUS_BADGE} />
                </td>
                <td className="px-4 py-3.5 text-neutral-500 whitespace-nowrap text-xs font-medium">
                  {task.due_date || '—'}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(task)}
                      className="text-xs font-bold border-2 border-black rounded-lg px-2.5 py-1 bg-white hover:bg-[#F5F5F5] shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(task.id)}
                      className="text-xs font-bold border-2 border-red-400 rounded-lg px-2.5 py-1 bg-white text-red-500 hover:bg-red-50 shadow-[2px_2px_0px_#f87171] hover:shadow-[3px_3px_0px_#f87171] transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
