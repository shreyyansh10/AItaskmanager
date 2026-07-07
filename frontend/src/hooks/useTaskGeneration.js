import { useState, useRef, useCallback, useEffect } from 'react'
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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function useTaskGeneration({ onCompleted, onError }) {
  const [stages, setStages] = useState(INITIAL_STAGES)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)

  const esRef = useRef(null)
  // Queue of stage name strings received from SSE
  const queueRef = useRef([])
  // Signals the worker to start/stop
  const workerActiveRef = useRef(false)
  // Prevents duplicate finish calls
  const completedRef = useRef(false)
  // Callbacks stored in refs so the worker closure always sees latest values
  const onCompletedRef = useRef(onCompleted)
  const onErrorRef = useRef(onError)
  // Stores tasks parsed from the Completed SSE message
  const completedTasksRef = useRef([])
  useEffect(() => { onCompletedRef.current = onCompleted }, [onCompleted])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  function closeSSE() {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
  }

  // Animation worker — runs for the lifetime of one generation job.
  // Drains queueRef one stage at a time, 300 ms apart.
  // Waits (polls every 50 ms) when the queue is empty but the job is still live.
  async function runWorker() {
    const stagesSnapshot = [...INITIAL_STAGES]
    let current = stagesSnapshot

    while (workerActiveRef.current) {
      if (queueRef.current.length === 0) {
        // Nothing queued yet — wait for the next SSE event
        await delay(50)
        continue
      }

      const stageName = queueRef.current.shift()

      if (stageName === 'Error') {
        current = current.map((s) =>
          s.status === 'active' ? { ...s, status: 'error' } : s
        )
        setStages([...current])
        workerActiveRef.current = false
        closeSSE()
        setIsGenerating(false)
        const msg = 'Pipeline reported an error during processing.'
        setGenerateError(msg)
        onErrorRef.current?.(msg)
        return
      }

      current = applyStageEvent(current, stageName)
      setStages([...current])

      if (stageName === 'Completed') {
        // Hold Completed visible, then reveal results
        await delay(800)
        workerActiveRef.current = false
        closeSSE()
        setIsGenerating(false)
        onCompletedRef.current?.(completedTasksRef.current)
        return
      }

      // Pace between stages — gives each stage ~300 ms of screen time
      await delay(300)
    }
  }

  // Called when SSE closes (cleanly or on error) without a Completed stage
  // having been queued yet. Ensures the worker eventually sees Completed.
  function ensureCompleted() {
    if (completedRef.current) return
    completedRef.current = true
    if (!queueRef.current.includes('Completed')) {
      queueRef.current.push('Completed')
    }
  }

  const generate = useCallback(async ({ text, file }) => {
    // Reset all state for a fresh run
    setStages(INITIAL_STAGES)
    setGenerateError(null)
    setIsGenerating(true)
    completedRef.current = false
    completedTasksRef.current = []
    queueRef.current = []
    workerActiveRef.current = false
    closeSSE()

    const formData = new FormData()
    if (file) formData.append('file', file)
    else formData.append('text', text)

    let jobId
    try {
      const { data } = await client.post('/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      jobId = data.job_id
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        'Generation failed. Ensure the backend is running and a provider is configured.'
      setGenerateError(detail)
      setIsGenerating(false)
      onErrorRef.current?.(detail)
      return
    }

    // Start the animation worker before opening SSE so it's ready to consume
    workerActiveRef.current = true
    runWorker()

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001'
    const es = new EventSource(`${baseURL}/progress/${jobId}`)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data)
        const { stage, message } = evt
        // Push into queue — worker consumes at its own pace
        queueRef.current.push(stage)
        if (stage === 'Completed') {
          completedRef.current = true
          // Backend embeds generated tasks in the Completed message
          if (message) {
            try {
              const payload = JSON.parse(message)
              if (Array.isArray(payload.tasks)) completedTasksRef.current = payload.tasks
            } catch { /* no tasks payload — fine */ }
          }
        }
      } catch {
        // ignore malformed frames
      }
    }

    es.onerror = () => {
      // SSE closed — ensure the worker will reach Completed and finish cleanly
      ensureCompleted()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { stages, isGenerating, generateError, generate }
}
