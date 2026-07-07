const CARD_CONFIGS = [
  { key: 'total',      label: 'Total',       accent: '' },
  { key: 'high',       label: 'High',        accent: 'border-red-300' },
  { key: 'medium',     label: 'Medium',      accent: 'border-amber-300' },
  { key: 'low',        label: 'Low',         accent: 'border-emerald-300' },
  { key: 'pending',    label: 'Pending',     accent: '' },
  { key: 'inProgress', label: 'In Progress', accent: 'border-blue-300' },
  { key: 'done',       label: 'Done',        accent: 'border-emerald-400' },
]

function StatCard({ label, value, accent }) {
  return (
    <div className={`bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_#000]
      hover:shadow-[6px_6px_0px_#000] hover:-translate-x-px hover:-translate-y-px
      transition-all duration-150 p-4 flex flex-col justify-between min-h-[88px] ${accent}`}>
      <span className="text-3xl font-black text-black leading-none">{value}</span>
      <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mt-2">
        {label}
      </span>
    </div>
  )
}

export default function SummaryCards({ tasks }) {
  const stats = {
    total:      tasks.length,
    high:       tasks.filter((t) => t.priority === 'High').length,
    medium:     tasks.filter((t) => t.priority === 'Medium').length,
    low:        tasks.filter((t) => t.priority === 'Low').length,
    pending:    tasks.filter((t) => t.status === 'Pending').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    done:       tasks.filter((t) => t.status === 'Done').length,
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {CARD_CONFIGS.map(({ key, label, accent }) => (
        <StatCard key={key} label={label} value={stats[key]} accent={accent} />
      ))}
    </div>
  )
}
