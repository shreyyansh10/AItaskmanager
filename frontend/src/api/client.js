import axios from 'axios'
import { API_BASE_URL } from './apiUrl'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  if (API_BASE_URL) return config

  return Promise.reject(
    new Error('API base URL is not configured. Set VITE_API_URL to enable backend requests.'),
  )
})

export default client
