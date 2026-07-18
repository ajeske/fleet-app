const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }

  return res.status === 204 ? null : res.json()
}

export function fetchVehicles(subcategoryId) {
  const query = subcategoryId ? `?subcategoryId=${encodeURIComponent(subcategoryId)}` : ''
  return request(`/vehicles${query}`)
}

export function createVehicle(payload) {
  return request('/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}