// All API calls go through the /api/ proxy (Vite in dev, nginx in Docker)
async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `API request failed (${response.status})`)
  }

  return response.json()
}

export function getAdvice() {
  return request('/coach')
}

export function refreshAdvice() {
  return request('/coach', { method: 'POST' })
}

export function getPersonalRecords() {
  return request('/personal-records')
}

export function getLongestRun() {
  return request('/longest-run')
}

export function getSettings() {
  return request('/settings')
}

// PUT /settings takes all fields as query params and returns the saved settings
export function updateSettings(settings) {
  const params = new URLSearchParams(settings)
  return request(`/settings?${params}`, { method: 'PUT' })
}

export function updatePersonalRecord(id, { time_seconds, date }) {
  const params = new URLSearchParams({ time_seconds, date })
  return request(`/personal-records/${id}?${params}`, { method: 'PUT' })
}
