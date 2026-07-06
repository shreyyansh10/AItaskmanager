export default function InputSection({ value, onChange }) {
  return (
    <div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] p-5">
      <label className="block text-sm font-bold text-black mb-2">
        Paste Meeting Notes
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your meeting notes, project brief, or any unstructured text here..."
        rows={7}
        className="w-full resize-none rounded-lg border-2 border-black bg-[#F5F5F5] px-4 py-3 text-sm text-black placeholder-neutral-400 font-medium focus:outline-none focus:bg-white transition-colors"
      />
      <p className="mt-2 text-xs text-neutral-400 font-medium">
        {value.length > 0
          ? `${value.length} characters · AI will extract tasks automatically`
          : 'Supports meeting notes, project briefs, emails, and more'}
      </p>
    </div>
  )
}
