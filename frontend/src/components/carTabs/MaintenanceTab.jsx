import { useEffect, useState } from 'react'
import { createMaintenance, fetchMaintenance } from '../../api/vehicleRecords'

const empty = { date: '', serviceType: '', cost: '', notes: '' }

export default function MaintenanceTab({ vehicleId }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setItems(await fetchMaintenance(vehicleId))
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
    if (!form.date || !form.serviceType.trim()) return

    setSaving(true)
    setError(null)
    try {
      await createMaintenance(vehicleId, {
        date: form.date,
        serviceType: form.serviceType.trim(),
        cost: Number(form.cost) || 0,
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
        <h4 className="mb-3 text-sm font-semibold text-slate-800">Add maintenance</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Service type</span>
            <input
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              required
              placeholder="Oil change, brakes..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Cost</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
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
          {saving ? 'Saving...' : 'Add record'}
        </button>
      </form>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading maintenance...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No maintenance records yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{item.date}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.serviceType}</td>
                  <td className="px-4 py-3">{Number(item.cost).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">{item.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
