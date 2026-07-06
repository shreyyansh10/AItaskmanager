function StatCard({ label, value, accent }) {
  return (
    <div className={`bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] p-4 flex flex-col gap-1 ${accent}`}>
      <span className="text-2xl font-black text-black">{value}</span>
      <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{label}</span>
    </div>
  )
}

export default function SummaryCards({ tasks }) {
  const total = tasks.length
  const high = tasks.filter((t) => t.priority === 'High').length
  const medium = tasks.filter((t) => t.priority === 'Medium').length
  const low = tasks.filter((t) => t.priority === 'Low').length
  const pending = tasks.filter((t) => t.status === 'Pending').length
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length
  const done = tasks.filter((t) => t.status === 'Done').length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      <StatCard label="Total" value={total} />
      <StatCard label="High" value={high} />
      <StatCard label="Medium" value={medium} />
      <StatCard label="Low" value={low} />
      <StatCard label="Pending" value={pending} />
      <StatCard label="In Progress" value={inProgress} />
      <StatCard label="Done" value={done} />
    </div>
  )
}
