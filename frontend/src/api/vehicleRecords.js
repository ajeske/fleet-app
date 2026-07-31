const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

async function request(path, options = {}) {
  const headers = { ...options.headers }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }

  return res.status === 204 ? null : res.json()
}

export function fetchAccidents(vehicleId) {
  return request(`/vehicles/${encodeURIComponent(vehicleId)}/accidents`)
}

export function createAccident(vehicleId, { date, description, document }) {
  const form = new FormData()
  form.append('date', date)
  form.append('description', description)
  if (document) form.append('document', document)

  return request(`/vehicles/${encodeURIComponent(vehicleId)}/accidents`, {
    method: 'POST',
    body: form,
  })
}

export function deleteAccident(vehicleId, accidentId) {
  return request(
    `/vehicles/${encodeURIComponent(vehicleId)}/accidents/${encodeURIComponent(accidentId)}`,
    { method: 'DELETE' },
  )
}

export function fetchMaintenance(vehicleId) {
  return request(`/vehicles/${encodeURIComponent(vehicleId)}/maintenance`)
}

export function createMaintenance(vehicleId, payload) {
  return request(`/vehicles/${encodeURIComponent(vehicleId)}/maintenance`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchPayments(vehicleId) {
  return request(`/vehicles/${encodeURIComponent(vehicleId)}/payments`)
}

export function createPayment(vehicleId, payload) {
  return request(`/vehicles/${encodeURIComponent(vehicleId)}/payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchInsurance(vehicleId) {
  return request(`/vehicles/${encodeURIComponent(vehicleId)}/insurance`)
}

export function createInsurance(vehicleId, payload) {
  return request(`/vehicles/${encodeURIComponent(vehicleId)}/insurance`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
