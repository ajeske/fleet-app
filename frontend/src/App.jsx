import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import VehiclePanel from './components/VehiclePanel'
import { categories } from './data/fleetData'
import { createVehicle, fetchVehicles } from './api/vehicles'

function findSubcategoryLabel(subcategoryId) {
  for (const category of categories) {
    const sub = category.subcategories.find((s) => s.id === subcategoryId)
    if (sub) return `${category.name} / ${sub.name}`
  }
  return 'Select a category'
}

export default function App() {
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('trucks-heavy')
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchVehicles(selectedSubcategoryId)
        if (!cancelled) setVehicles(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [selectedSubcategoryId])

  const handleAddVehicle = async (form) => {
    setSaving(true)
    setError(null)
    try {
      const created = await createVehicle({
        subcategoryId: selectedSubcategoryId,
        ...form,
      })
      setVehicles((prev) => [...prev, created])
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-screen bg-white text-slate-900">
      <Sidebar
        categories={categories}
        selectedSubcategoryId={selectedSubcategoryId}
        onSelectSubcategory={setSelectedSubcategoryId}
      />
      <VehiclePanel
        title={findSubcategoryLabel(selectedSubcategoryId)}
        vehicles={vehicles}
        loading={loading}
        error={error}
        saving={saving}
        onAddVehicle={handleAddVehicle}
      />
    </div>
  )
}
