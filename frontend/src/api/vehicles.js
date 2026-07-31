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

export function fetchVehicles(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return request(`/vehicles${query}`)
}

export function fetchVehicle(id) {
  return request(`/vehicles/${encodeURIComponent(id)}`)
}

export function createVehicle(payload) {
  return request('/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateVehicle(id, payload) {
  return request(`/vehicles/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
