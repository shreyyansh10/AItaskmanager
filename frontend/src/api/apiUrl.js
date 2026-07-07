const rawApiUrl = import.meta.env.VITE_API_URL ?? ''

export const API_BASE_URL = rawApiUrl.replace(/\/$/, '')

export function buildApiUrl(path) {
  if (!path) return API_BASE_URL
  if (!API_BASE_URL) return path

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return new URL(normalizedPath, `${API_BASE_URL}/`).toString()
}