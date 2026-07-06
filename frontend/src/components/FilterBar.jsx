const PRIORITIES = ['', 'High', 'Medium', 'Low']
const STATUSES = ['', 'Pending', 'In Progress', 'Done']

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-2 border-black rounded-lg px-3 py-2 text-sm font-medium bg-white text-black shadow-[2px_2px_0px_#000] focus:outline-none focus:shadow-[3px_3px_0px_#000] transition-all min-w-[130px]"
      >
        <option value="">All</option>
        {options.filter(Boolean).map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

export default function FilterBar({ filters, onFilterChange, onClearFilters }) {
  const hasActive = filters.owner || filters.priority || filters.status

  return (
    <div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] p-4 flex flex-wrap items-end gap-4">
      <FilterSelect
        label="Priority"
        value={filters.priority}
        options={PRIORITIES}
        onChange={(v) => onFilterChange({ ...filters, priority: v })}
      />
      <FilterSelect
        label="Status"
        value={filters.status}
        options={STATUSES}
        onChange={(v) => onFilterChange({ ...filters, status: v })}
      />

      {/* Owner text filter */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Owner</label>
        <input
          type="text"
          value={filters.owner}
          onChange={(e) => onFilterChange({ ...filters, owner: e.target.value })}
          placeholder="Filter by owner…"
          className="border-2 border-black rounded-lg px-3 py-2 text-sm font-medium bg-white text-black shadow-[2px_2px_0px_#000] focus:outline-none focus:shadow-[3px_3px_0px_#000] transition-all min-w-[160px]"
        />
      </div>

      {hasActive && (
        <button
          onClick={onClearFilters}
          className="self-end text-xs font-bold border-2 border-black rounded-lg px-3 py-2 bg-white hover:bg-[#F5F5F5] shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] transition-all"
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}
