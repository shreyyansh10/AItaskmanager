import { useState, useRef, useCallback } from 'react'
import client from '../api/client'

const STAGE_NAMES = [
  'Reading File',
  'Extracting Text',
  'Creating Prompt',
  'Calling Provider',
  'Waiting for Response',
  'Parsing JSON',
  'Validating Output',
  'Saving Tasks',
  'Completed',
]

export const INITIAL_STAGES = STAGE_NAMES.map((name) => ({ name, status: 'pending' }))

function allDone() {
  return STAGE_NAMES.map((name) => ({ name, status: 'done' }))
}

function applyStageEvent(prev, stageName) {
  const idx = prev.findIndex((s) => s.name === stageName)
  if (idx === -1) return prev
  return prev.map((s, i) => {
    if (i < idx) return { ...s, status: 'done' }
    if (i === idx) {
      if (stageName === 'Completed') return { ...s, status: 'done' }
      if (stageName === 'Error') return { ...s, status: 'error' }
      return { ...s, status: 'active' }
    }
    return { ...s, status: 'pending' }
  })
}

export function useTaskGeneration({ onCompleted, onError }) {
  const [stages, setStages] = useState(INITIAL_STAGES)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)
  const esRef = useRef(null)
  // Track whether onCompleted has already been called for this run
  const completedRef = useRef(false)

  function closeSSE() {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
  }

  function finish() {
    if (completedRef.current) return
    completedRef.current = true
    closeSSE()
    setIsGenerating(false)
    setStages(allDone())
    onCompleted?.()
  }

  const generate = useCallback(async ({ text, file }) => {
    setStages(INITIAL_STAGES)
    setGenerateError(null)
    setIsGenerating(true)
    completedRef.current = false
    closeSSE()

    // POST /generate — multipart/form-data (backend uses Form fields)
    const formData = new FormData()
    if (file) {
      formData.append('file', file)
    } else {
      formData.append('text', text)
    }

    let jobId
    try {
      const { data } = await client.post('/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // Works with both old (201 + tasks) and new (202 + job_id only) backend
      jobId = data.job_id
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        'Generation failed. Ensure the backend is running and a provider is configured.'
      setGenerateError(detail)
      setIsGenerating(false)
      onError?.(detail)
      return
    }

    // Open SSE to watch live progress
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001'
    const es = new EventSource(`${baseURL}/progress/${jobId}`)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const { stage } = JSON.parse(e.data)
        setStages((prev) => applyStageEvent(prev, stage))

        if (stage === 'Completed') {
          finish()
        } else if (stage === 'Error') {
          closeSSE()
          setIsGenerating(false)
          const msg = 'Pipeline reported an error during processing.'
          setGenerateError(msg)
          onError?.(msg)
        }
      } catch {
        // ignore malformed frames
      }
    }

    es.onerror = () => {
      // SSE connection closed — either:
      //   (a) server closed it cleanly after Completed (onmessage already called finish())
      //   (b) job_id not found (404) because backend queue was never registered
      //   (c) unexpected network drop mid-flight
      // In cases (a) and (b) we still have tasks in the DB — always call finish()
      // so the UI reveals results. finish() is idempotent via completedRef.
      finish()
    }
  }, [onCompleted, onError]) // eslint-disable-line react-hooks/exhaustive-deps

  return { stages, isGenerating, generateError, generate }
}
