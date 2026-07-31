import { useEffect, useState } from 'react'
import { createInsurance, fetchInsurance } from '../../api/vehicleRecords'

const empty = {
  provider: '',
  policyNumber: '',
  coverage: '',
  startDate: '',
  endDate: '',
  premium: '',
  notes: '',
}

export default function InsuranceTab({ vehicleId }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setItems(await fetchInsurance(vehicleId))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [vehicleId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.provider.trim() || !form.policyNumber.trim()) return

    setSaving(true)
    setError(null)
    try {
      await createInsurance(vehicleId, {
        provider: form.provider.trim(),
        policyNumber: form.policyNumber.trim(),
        coverage: form.coverage.trim() || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        premium: form.premium === '' ? null : Number(form.premium),
        notes: form.notes.trim() || null,
      })
      setForm(empty)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-800">Add insurance policy</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Provider</span>
            <input
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Policy number</span>
            <input
              value={form.policyNumber}
              onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Coverage</span>
            <input
              value={form.coverage}
              onChange={(e) => setForm({ ...form, coverage: e.target.value })}
              placeholder="Liability, comprehensive..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Start date</span>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">End date</span>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Premium</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.premium}
              onChange={(e) => setForm({ ...form, premium: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Notes</span>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-3 rounded-md bg-purple-700 px-3 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Add policy'}
        </button>
      </form>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading insurance...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No insurance policies yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h5 className="text-sm font-semibold text-slate-900">{item.provider}</h5>
                <p className="font-mono text-xs text-slate-500">{item.policyNumber}</p>
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.coverage || 'No coverage details'}</p>
              <p className="mt-2 text-xs text-slate-500">
                {item.startDate || '—'} → {item.endDate || '—'}
                {item.premium != null ? ` · Premium ${Number(item.premium).toFixed(2)}` : ''}
              </p>
              {item.notes && <p className="mt-1 text-sm text-slate-600">{item.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
