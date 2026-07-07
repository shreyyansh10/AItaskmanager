import { useState, useCallback, useRef } from 'react'
import client from '../api/client'

const DEBOUNCE_MS = 400

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [filters, setFilters] = useState({ owner: '', priority: '', status: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  // Only start fetching after the first explicit reloadTasks() call
  const initializedRef = useRef(false)
  const debounceRef = useRef(null)

  function buildParams(f) {
    const params = {}
    if (f.owner) params.owner = f.owner
    if (f.priority) params.priority = f.priority
    if (f.status) params.status = f.status
    return params
  }

  const fetchTasks = useCallback(async (f) => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const { data } = await client.get('/tasks', { params: buildParams(f) })
      setTasks(data)
    } catch (err) {
      setFetchError(err?.response?.data?.detail || 'Failed to load tasks.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Called by App to inject just-generated tasks directly (no DB fetch)
  const setCurrentTasks = useCallback((newTasks) => {
    initializedRef.current = true
    setTasks(newTasks)
  }, [])

  // Called by App for already_processed case — fetches all tasks from DB
  const reloadTasks = useCallback(() => {
    initializedRef.current = true
    fetchTasks(filters)
  }, [filters, fetchTasks])

  const reloadTasksForSourceText = useCallback(async (sourceText) => {
    initializedRef.current = true
    setIsLoading(true)
    setFetchError(null)
    try {
      const normalizedSourceText = sourceText.trim().toLowerCase()
      const { data } = await client.get('/tasks')
      setTasks(
        data.filter((task) =>
          (task.source_text || '').trim().toLowerCase() === normalizedSourceText
        )
      )
    } catch (err) {
      setFetchError(err?.response?.data?.detail || 'Failed to load tasks.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced filter refetch — only runs after initialized
  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters)
    if (!initializedRef.current) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchTasks(newFilters), DEBOUNCE_MS)
  }, [fetchTasks])

  const updateTask = useCallback(async (taskId, data) => {
    try {
      const { data: updated } = await client.put(`/tasks/${taskId}`, data)
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)))
      return updated
    } catch (err) {
      throw new Error(err?.response?.data?.detail || 'Failed to update task.')
    }
  }, [])

  const deleteTask = useCallback(async (taskId) => {
    try {
      await client.delete(`/tasks/${taskId}`)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } catch (err) {
      throw new Error(err?.response?.data?.detail || 'Failed to delete task.')
    }
  }, [])

  const exportJson = useCallback(() => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001'
    window.open(`${baseURL}/tasks/export/json`, '_blank')
  }, [])

  return {
    tasks,
    isLoading,
    fetchError,
    filters,
    setFilters: applyFilters,
    updateTask,
    deleteTask,
    reloadTasks,
    reloadTasksForSourceText,
    setCurrentTasks,
    exportJson,
  }
}
