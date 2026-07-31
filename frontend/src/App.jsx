import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import VehiclePanel from './components/VehiclePanel'
import WelcomePanel from './components/WelcomePanel'
import CarDetailPanel from './components/CarDetailPanel'
import { vehicleStatuses } from './data/fleetData'
import { createVehicle, fetchVehicles } from './api/vehicles'

export default function App() {
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)
  const [startWithFormOpen, setStartWithFormOpen] = useState(false)
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!selectedStatus || selectedVehicleId) {
      if (!selectedStatus) {
        setVehicles([])
        setLoading(false)
        setError(null)
      }
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchVehicles(selectedStatus)
        if (!cancelled) setVehicles(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [selectedStatus, selectedVehicleId])

  const handleSelectStatus = (status) => {
    setStartWithFormOpen(false)
    setSelectedVehicleId(null)
    setSelectedStatus(status)
  }

  const handleWelcomeAdd = () => {
    setSelectedVehicleId(null)
    setStartWithFormOpen(true)
    setSelectedStatus('Active')
  }

  const handleAddVehicle = async (form) => {
    setSaving(true)
    setError(null)
    try {
      const created = await createVehicle({
        ...form,
        status: selectedStatus,
      })
      setVehicles((prev) => [...prev, created])
      setStartWithFormOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDetailSaved = (updated) => {
    if (updated.status !== selectedStatus) {
      setSelectedStatus(updated.status)
      setSelectedVehicleId(null)
      return
    }
    setVehicles((prev) =>
      prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)),
    )
  }

  let mainPanel = <WelcomePanel onAddVehicle={handleWelcomeAdd} />
  if (selectedVehicleId) {
    mainPanel = (
      <CarDetailPanel
        vehicleId={selectedVehicleId}
        onBack={() => setSelectedVehicleId(null)}
        onSaved={handleDetailSaved}
      />
    )
  } else if (selectedStatus) {
    mainPanel = (
      <VehiclePanel
        title={`Cars / ${selectedStatus}`}
        vehicles={vehicles}
        loading={loading}
        error={error}
        saving={saving}
        onAddVehicle={handleAddVehicle}
        onViewCar={setSelectedVehicleId}
        startWithFormOpen={startWithFormOpen}
      />
    )
  }

  return (
    <div className="flex h-screen bg-white text-slate-900">
      <Sidebar
        statuses={vehicleStatuses}
        selectedStatus={selectedStatus}
        onSelectStatus={handleSelectStatus}
      />
      {mainPanel}
    </div>
  )
}
