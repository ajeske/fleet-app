import { useEffect, useState } from 'react'
import { vehicleStatuses } from '../data/fleetData'
import { fetchVehicle, updateVehicle } from '../api/vehicles'
import AccidentsTab from './carTabs/AccidentsTab'
import MaintenanceTab from './carTabs/MaintenanceTab'
import PaymentsTab from './carTabs/PaymentsTab'
import InsuranceTab from './carTabs/InsuranceTab'

const TABS = [
  { id: 'basic', label: 'Basic' },
  { id: 'accidents', label: 'Accidents' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'payments', label: 'Payments history' },
  { id: 'insurance', label: 'Insurance' },
]

const PLACEHOLDER_SRC =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="80" fill="#e2e8f0"/>
      <text x="80" y="88" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#64748b">No photo</text>
    </svg>`,
  )

function StatusBadge({ status }) {
  const styles = {
    Active: 'bg-green-100 text-green-800',
    Maintenance: 'bg-amber-100 text-amber-800',
    Inactive: 'bg-slate-100 text-slate-600',
    Sold: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.Inactive}`}>
      {status}
    </span>
  )
}

function fieldFromVehicle(vehicle) {
  return {
    licensePlate: vehicle.licensePlate ?? '',
    make: vehicle.make ?? '',
    model: vehicle.model ?? '',
    status: vehicle.status ?? 'Active',
    imageUrl: vehicle.imageUrl ?? '',
    kilometers: vehicle.kilometers ?? 0,
    year: vehicle.year ?? '',
    color: vehicle.color ?? '',
    vin: vehicle.vin ?? '',
    notes: vehicle.notes ?? '',
  }
}

export default function CarDetailPanel({ vehicleId, onBack, onSaved }) {
  const [activeTab, setActiveTab] = useState('basic')
  const [vehicle, setVehicle] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setActiveTab('basic')

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchVehicle(vehicleId)
        if (!cancelled) {
          setVehicle(data)
          setForm(fieldFromVehicle(data))
        }
      } catch (err) {
        if (!cancelled) {
          setVehicle(null)
          setForm(null)
          setError(err.message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [vehicleId])

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form) return

    setSaving(true)
    setError(null)
    try {
      const payload = {
        licensePlate: form.licensePlate.trim(),
        make: form.make.trim(),
        model: form.model.trim(),
        status: form.status,
        imageUrl: form.imageUrl.trim() || null,
        kilometers: Number(form.kilometers) || 0,
        year: form.year === '' ? null : Number(form.year),
        color: form.color.trim() || null,
        vin: form.vin.trim() || null,
        notes: form.notes.trim() || null,
      }

      const updated = await updateVehicle(vehicleId, payload)
      setVehicle(updated)
      setForm(fieldFromVehicle(updated))
      onSaved?.(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Loading car profile...</p>
      </main>
    )
  }

  if (!vehicle || !form) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-white px-6">
        <p className="text-sm text-red-700">{error ?? 'Car not found'}</p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Back to list
        </button>
      </main>
    )
  }

  const photoSrc = form.imageUrl.trim() || PLACEHOLDER_SRC

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-1 text-sm text-slate-500 hover:text-slate-800"
          >
            ← Back to list
          </button>
          <h2 className="text-lg font-semibold text-slate-900">
            {form.make} {form.model}
          </h2>
          <p className="font-mono text-sm text-slate-500">{form.licensePlate}</p>
        </div>
        {activeTab === 'basic' && (
          <button
            type="submit"
            form="car-detail-form"
            disabled={saving}
            className="rounded-md bg-purple-700 px-3 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        )}
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4">
        {TABS.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'shrink-0 border-b-2 px-3 py-3 text-sm transition',
                selected
                  ? 'border-purple-700 font-medium text-purple-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      {error && activeTab === 'basic' && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl">
          {activeTab === 'basic' && (
            <form id="car-detail-form" onSubmit={handleSave}>
              <section className="flex flex-col items-center border-b border-slate-200 pb-8 text-center sm:flex-row sm:items-start sm:gap-8 sm:text-left">
                <img
                  src={photoSrc}
                  alt={`${form.make} ${form.model}`}
                  className="h-36 w-36 rounded-full border border-slate-200 object-cover bg-slate-100"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER_SRC
                  }}
                />
                <div className="mt-4 flex-1 sm:mt-0">
                  <h3 className="text-2xl font-semibold text-slate-900">
                    {form.make || '—'} {form.model || ''}
                  </h3>
                  <p className="mt-1 font-mono text-sm text-slate-600">{form.licensePlate || 'No plate'}</p>
                  <div className="mt-2">
                    <StatusBadge status={form.status} />
                  </div>
                  <label className="mt-4 block text-sm">
                    <span className="mb-1 block text-slate-600">Photo URL</span>
                    <input
                      value={form.imageUrl}
                      onChange={(e) => setField('imageUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </label>
                </div>
              </section>

              <section className="border-b border-slate-200 py-6">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Identity</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-600">License plate</span>
                    <input
                      value={form.licensePlate}
                      onChange={(e) => setField('licensePlate', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-600">VIN</span>
                    <input
                      value={form.vin}
                      onChange={(e) => setField('vin', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-600">Make</span>
                    <input
                      value={form.make}
                      onChange={(e) => setField('make', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-600">Model</span>
                    <input
                      value={form.model}
                      onChange={(e) => setField('model', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-600">Year</span>
                    <input
                      type="number"
                      value={form.year}
                      onChange={(e) => setField('year', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-600">Color</span>
                    <input
                      value={form.color}
                      onChange={(e) => setField('color', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="mb-1 block text-slate-600">Status</span>
                    <select
                      value={form.status}
                      onChange={(e) => setField('status', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    >
                      {vehicleStatuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="border-b border-slate-200 py-6">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Usage</h4>
                <label className="block max-w-xs text-sm">
                  <span className="mb-1 block text-slate-600">Kilometers</span>
                  <input
                    type="number"
                    min="0"
                    value={form.kilometers}
                    onChange={(e) => setField('kilometers', e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                </label>
              </section>

              <section className="py-6">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Notes</h4>
                <textarea
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  placeholder="Service notes, remarks..."
                />
              </section>
            </form>
          )}

          {activeTab === 'accidents' && <AccidentsTab vehicleId={vehicleId} />}
          {activeTab === 'maintenance' && <MaintenanceTab vehicleId={vehicleId} />}
          {activeTab === 'payments' && <PaymentsTab vehicleId={vehicleId} />}
          {activeTab === 'insurance' && <InsuranceTab vehicleId={vehicleId} />}
        </div>
      </div>
    </main>
  )
}
