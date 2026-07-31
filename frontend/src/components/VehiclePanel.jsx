import { useEffect, useState } from 'react'

const emptyForm = { licensePlate: '', make: '', model: '' }

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

export default function VehiclePanel({
  title,
  vehicles,
  loading,
  error,
  saving,
  onAddVehicle,
  onViewCar,
  startWithFormOpen = false,
}) {
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(startWithFormOpen)

  useEffect(() => {
    setShowForm(startWithFormOpen)
    setForm(emptyForm)
  }, [title, startWithFormOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.licensePlate.trim() || !form.make.trim() || !form.model.trim()) return

    await onAddVehicle(form)
    setForm(emptyForm)
    setShowForm(false)
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{vehicles.length} car(s)</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-purple-700 px-3 py-2 text-sm font-medium text-white hover:bg-purple-800"
        >
          {showForm ? 'Cancel' : 'Add car'}
        </button>
      </header>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['licensePlate', 'License plate'],
              ['make', 'Make'],
              ['model', 'Model'],
            ].map(([field, label]) => (
              <label key={field} className="block text-sm">
                <span className="mb-1 block text-slate-600">{label}</span>
                <input
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-3 rounded-md bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save car'}
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="text-sm text-slate-500">Loading cars...</div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No cars with this status yet. Click “Add car” to create one.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">License plate</th>
                  <th className="px-4 py-3 font-medium">Make</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{vehicle.licensePlate}</td>
                    <td className="px-4 py-3">{vehicle.make}</td>
                    <td className="px-4 py-3">{vehicle.model}</td>
                    <td className="px-4 py-3"><StatusBadge status={vehicle.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onViewCar?.(vehicle.id)}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View Car
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
