async function request(path, options = {}) {
  const response = await fetch(path, {
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
