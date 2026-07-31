import { useEffect, useState } from 'react'
import { createPayment, fetchPayments } from '../../api/vehicleRecords'

const empty = { date: '', amount: '', direction: 'received', insurer: '', notes: '' }

export default function PaymentsTab({ vehicleId }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setItems(await fetchPayments(vehicleId))
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
    if (!form.date || form.amount === '') return

    setSaving(true)
    setError(null)
    try {
      await createPayment(vehicleId, {
        date: form.date,
        amount: Number(form.amount),
        direction: form.direction,
        insurer: form.insurer.trim() || null,
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
        <h4 className="mb-3 text-sm font-semibold text-slate-800">Add payment</h4>
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
            <span className="mb-1 block text-slate-600">Amount</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Direction</span>
            <select
              value={form.direction}
              onChange={(e) => setForm({ ...form, direction: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            >
              <option value="received">Received (from insurance)</option>
              <option value="paid">Paid (to insurance / claim cost)</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Insurer</span>
            <input
              value={form.insurer}
              onChange={(e) => setForm({ ...form, insurer: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
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
          {saving ? 'Saving...' : 'Add payment'}
        </button>
      </form>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading payments...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No payments recorded yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Direction</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Insurer</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{item.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        item.direction === 'received'
                          ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
                          : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800'
                      }
                    >
                      {item.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{Number(item.amount).toFixed(2)}</td>
                  <td className="px-4 py-3">{item.insurer || '—'}</td>
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
