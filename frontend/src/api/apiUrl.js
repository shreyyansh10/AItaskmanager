const rawApiUrl = import.meta.env.VITE_API_URL ?? ''

export const API_BASE_URL = rawApiUrl.trim().replace(/\/$/, '')

export function buildApiUrl(path) {
  if (!path) return API_BASE_URL

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE_URL) return normalizedPath

  if (API_BASE_URL.startsWith('/')) {
    return `${API_BASE_URL}${normalizedPath}`
  }

  return new URL(normalizedPath, `${API_BASE_URL}/`).toString()
}