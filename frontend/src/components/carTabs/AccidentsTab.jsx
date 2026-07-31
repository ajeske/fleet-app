import { useEffect, useState } from 'react'
import { createAccident, deleteAccident, fetchAccidents } from '../../api/vehicleRecords'

export default function AccidentsTab({ vehicleId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [document, setDocument] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setItems(await fetchAccidents(vehicleId))
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
    if (!date || !description.trim()) return

    setSaving(true)
    setError(null)
    try {
      await createAccident(vehicleId, { date, description, document })
      setDate('')
      setDescription('')
      setDocument(null)
      e.target.reset()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (accidentId) => {
    setError(null)
    try {
      await deleteAccident(vehicleId, accidentId)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-800">Add accident</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Scanned PDF (optional)</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-purple-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-purple-800"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-3 rounded-md bg-purple-700 px-3 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Add accident'}
        </button>
      </form>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading accidents...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No accidents recorded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.date}</p>
                <p className="text-sm text-slate-600">{item.description}</p>
                {item.documentPath && (
                  <a
                    href={item.documentPath}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-sm font-medium text-purple-700 hover:underline"
                  >
                    Open PDF{item.documentName ? ` (${item.documentName})` : ''}
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="self-start rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
