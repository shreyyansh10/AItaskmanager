import { useRef, useState } from 'react'

const ACCEPTED = ['.txt', '.pdf', '.docx']
const ACCEPTED_MIME = [
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

function isValidFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase()
  return ACCEPTED.includes(ext) || ACCEPTED_MIME.includes(file.type)
}

export default function UploadArea({ file, onFileSelect, onClear }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && isValidFile(dropped)) onFileSelect(dropped)
  }

  function handleChange(e) {
    const selected = e.target.files[0]
    if (selected) onFileSelect(selected)
    e.target.value = ''
  }

  return (
    <div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] p-5">
      <label className="block text-sm font-bold text-black mb-2">
        Upload File
      </label>

      {file ? (
        /* Selected file display */
        <div className="flex items-center justify-between rounded-lg border-2 border-black bg-[#F5F5F5] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md border-2 border-black bg-white flex items-center justify-center text-xs font-black text-black">
              {file.name.split('.').pop().toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-black leading-tight">{file.name}</p>
              <p className="text-xs text-neutral-400 font-medium">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="text-xs font-bold text-black border-2 border-black rounded-lg px-3 py-1 bg-white hover:bg-[#F5F5F5] shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] transition-all"
          >
            Remove
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-lg border-2 border-dashed transition-colors px-6 py-8 text-center
            ${dragging
              ? 'border-black bg-neutral-100'
              : 'border-neutral-300 bg-[#F5F5F5] hover:border-black hover:bg-neutral-100'
            }`}
        >
          <div className="w-10 h-10 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000] flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm font-bold text-black">
            Drop file here or <span className="underline">click to browse</span>
          </p>
          <p className="text-xs text-neutral-400 font-medium mt-1">
            Supports .txt, .pdf, .docx
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
