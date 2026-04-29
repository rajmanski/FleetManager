import { useEffect, useMemo } from 'react'
import type { Driver } from '@/hooks/drivers/useDrivers'
import type { Vehicle } from '@/hooks/vehicles/useVehicles'
import type { SelectOption } from '@/components/ui/Select'
import { isDriverAdrValid } from './orderPlanningFlowData'
import { useResourceAvailability } from './useResourceAvailability'

type Args = {
  vehicles: Vehicle[]
  drivers: Driver[]
  startTime: string
  totalWeightKg: number
  hasHazardousCargo: boolean
  selectedVehicleId: string
  selectedDriverId: string
  setVehicleId: (value: string) => void
  setDriverId: (value: string) => void
}

function buildDateRange(startTime: string): { dateFrom: string; dateTo: string } | null {
  const start = new Date(startTime)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  const toDate = (d: Date) => d.toISOString().slice(0, 10)
  return { dateFrom: toDate(start), dateTo: toDate(end) }
}

export function useOrderPlanningResourceFilters({
  vehicles,
  drivers,
  startTime,
  totalWeightKg,
  hasHazardousCargo,
  selectedVehicleId,
  selectedDriverId,
  setVehicleId,
  setDriverId,
}: Args) {
  const dateRange = useMemo(() => buildDateRange(startTime), [startTime])

  const { availableVehicleIds, availableDriverIds, isPending } = useResourceAvailability(
    vehicles,
    drivers,
    dateRange,
  )

  const vehicleOptions = useMemo<SelectOption[]>(
    () =>
      vehicles
        .filter((vehicle) => {
          if (availableVehicleIds && !availableVehicleIds.has(vehicle.id)) return false
          return !(vehicle.capacity_kg && vehicle.capacity_kg > 0 && totalWeightKg > vehicle.capacity_kg);

        })
        .map((vehicle) => ({
          value: String(vehicle.id),
          label:
            [vehicle.plate_number, vehicle.brand, vehicle.model].filter(Boolean).join(' · ') ||
            vehicle.vin,
        })),
    [availableVehicleIds, vehicles, totalWeightKg],
  )

  const driverOptions = useMemo<SelectOption[]>(
    () =>
      drivers
        .filter((driver) => {
          if (availableDriverIds && !availableDriverIds.has(driver.id)) return false
          if (hasHazardousCargo && !isDriverAdrValid(driver)) return false
          return true
        })
        .map((driver) => ({
          value: String(driver.id),
          label: `${driver.first_name} ${driver.last_name}`,
        })),
    [availableDriverIds, drivers, hasHazardousCargo],
  )

  useEffect(() => {
    if (!selectedVehicleId) return
    const stillAvailable = vehicleOptions.some((o) => o.value === selectedVehicleId)
    if (!stillAvailable) setVehicleId('')
  }, [vehicleOptions, selectedVehicleId, setVehicleId])

  useEffect(() => {
    if (!selectedDriverId) return
    const stillAvailable = driverOptions.some((o) => o.value === selectedDriverId)
    if (!stillAvailable) setDriverId('')
  }, [driverOptions, selectedDriverId, setDriverId])

  return { vehicleOptions, driverOptions, isPending }
}
