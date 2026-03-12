import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { useDrivers } from '@/hooks/drivers/useDrivers'
import { useTrips } from '@/hooks/trips/useTrips'

type CreateTripModalProps = {
  orderId: number
  isOpen: boolean
  onClose: () => void
  totalCargoWeightKg: number
}

export function CreateTripModal({
  orderId,
  isOpen,
  onClose,
  totalCargoWeightKg,
}: CreateTripModalProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')
  const [startDateTime, setStartDateTime] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const { vehiclesQuery } = useVehicles({
    page: 1,
    limit: 100,
    statusFilter: 'Available',
    search: '',
    showDeleted: false,
  })
  const { driversQuery } = useDrivers({
    page: 1,
    limit: 100,
    statusFilter: '',
    search: '',
    showDeleted: false,
  })
  const { createTripMutation } = useTrips()

  useEffect(() => {
    if (!isOpen) {
      setSelectedVehicleId('')
      setSelectedDriverId('')
      setStartDateTime('')
      setError(null)
    }
  }, [isOpen])

  const availableVehicles = useMemo(() => {
    const vehicles = vehiclesQuery.data?.data ?? []
    return vehicles.filter((v) => v.status === 'Available')
  }, [vehiclesQuery.data])

  const availableDrivers = useMemo(() => {
    const drivers = driversQuery.data?.data ?? []
    return drivers.filter(
      (d) => d.status === 'Available' || d.status === 'OnLeave'
    )
  }, [driversQuery.data])

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedVehicleId || !selectedDriverId || !startDateTime) {
      setError('Please select vehicle, driver and start time.')
      return
    }

    const vehicle = availableVehicles.find(
      (v) => v.id === Number(selectedVehicleId)
    )
    if (vehicle?.capacity_kg && totalCargoWeightKg > vehicle.capacity_kg) {
      setError(
        `Total cargo weight (${totalCargoWeightKg} kg) exceeds vehicle capacity (${vehicle.capacity_kg} kg).`
      )
      return
    }

    const start = new Date(startDateTime)
    if (Number.isNaN(start.getTime())) {
      setError('Invalid start time.')
      return
    }

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    if (start < oneHourAgo) {
      setError('Start time must be in the future or at most 1 hour in the past.')
      return
    }

    try {
      await createTripMutation.mutateAsync({
        order_id: orderId,
        vehicle_id: Number(selectedVehicleId),
        driver_id: Number(selectedDriverId),
        start_time: start.toISOString(),
      })
      onClose()
    } catch (err) {
      setError('Failed to create trip.')
    }
  }

  const isSubmitting = createTripMutation.isPending

  return (
    <Modal title="Create trip" error={error}>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Select
          label="Vehicle"
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          options={availableVehicles.map((v) => ({
            value: v.id,
            label: `${v.vin} ${v.plate_number ? `(${v.plate_number})` : ''}`,
          }))}
          required
          disabled={vehiclesQuery.isLoading || isSubmitting}
        />
        <Select
          label="Driver"
          value={selectedDriverId}
          onChange={(e) => setSelectedDriverId(e.target.value)}
          options={availableDrivers.map((d) => ({
            value: d.id,
            label: `${d.first_name} ${d.last_name}`,
          }))}
          required
          disabled={driversQuery.isLoading || isSubmitting}
        />
        <Input
          label="Planned start"
          type="datetime-local"
          value={startDateTime}
          onChange={(e) => setStartDateTime(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500">
          Total cargo weight: <span className="font-semibold">{totalCargoWeightKg} kg</span>
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create trip'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

