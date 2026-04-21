import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import type { Driver } from '@/hooks/drivers/useDrivers'
import type { Vehicle } from '@/hooks/vehicles/useVehicles'
import { isDriverAdrValid } from './orderPlanningFlow.helpers'

type SelectOption = { value: string; label: string }

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
  if (Number.isNaN(start.getTime())) {
    return null
  }
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

  const vehicleOptions = useMemo<SelectOption[]>(
    () =>
      vehicles.map((vehicle) => ({
        value: String(vehicle.id),
        label:
          [vehicle.plate_number, vehicle.brand, vehicle.model]
            .filter(Boolean)
            .join(' · ') || vehicle.vin,
      })),
    [vehicles],
  )

  const driverOptions = useMemo<SelectOption[]>(
    () =>
      drivers.map((driver) => ({
        value: String(driver.id),
        label: `${driver.first_name} ${driver.last_name}`,
      })),
    [drivers],
  )

  const vehicleIds = useMemo(() => vehicles.map((vehicle) => vehicle.id), [vehicles])
  const driverIds = useMemo(() => drivers.map((driver) => driver.id), [drivers])

  const vehicleAvailabilityQuery = useQuery({
    queryKey: ['order-planning-vehicle-availability', dateRange, vehicleIds],
    queryFn: async () => {
      if (!dateRange || vehicles.length === 0) {
        return new Set<number>(vehicles.map((vehicle) => vehicle.id))
      }

      const checks = await Promise.all(
        vehicles.map(async (vehicle) => {
          try {
            const res = await api.get<{ available: boolean }>(
              `/api/v1/vehicles/${vehicle.id}/availability`,
              {
                params: {
                  date_from: dateRange.dateFrom,
                  date_to: dateRange.dateTo,
                },
              },
            )
            return res.data.available ? vehicle.id : null
          } catch {
            return null
          }
        }),
      )

      return new Set<number>(checks.filter((id): id is number => id != null))
    },
  })

  const driverAvailabilityQuery = useQuery({
    queryKey: ['order-planning-driver-availability', dateRange, driverIds],
    queryFn: async () => {
      if (!dateRange || drivers.length === 0) {
        return new Set<number>(drivers.map((driver) => driver.id))
      }

      const checks = await Promise.all(
        drivers.map(async (driver) => {
          try {
            const res = await api.get<{ available: boolean }>(
              `/api/v1/drivers/${driver.id}/availability`,
              {
                params: {
                  date_from: dateRange.dateFrom,
                  date_to: dateRange.dateTo,
                },
              },
            )
            return res.data.available ? driver.id : null
          } catch {
            return null
          }
        }),
      )

      return new Set<number>(checks.filter((id): id is number => id != null))
    },
  })

  const filteredVehicleOptions = useMemo(() => {
    const availableIds = vehicleAvailabilityQuery.data
    if (!availableIds) {
      return vehicleOptions
    }
    return vehicleOptions.filter((option) => {
      if (!availableIds.has(Number(option.value))) {
        return false
      }
      const vehicle = vehicles.find((v) => String(v.id) === option.value)
      if (!vehicle?.capacity_kg || vehicle.capacity_kg <= 0) {
        return true
      }
      return totalWeightKg <= vehicle.capacity_kg
    })
  }, [vehicleAvailabilityQuery.data, vehicleOptions, vehicles, totalWeightKg])

  const filteredDriverOptions = useMemo(() => {
    const availableIds = driverAvailabilityQuery.data
    if (!availableIds) {
      return driverOptions
    }
    return driverOptions.filter((option) => {
      if (!availableIds.has(Number(option.value))) {
        return false
      }
      if (!hasHazardousCargo) {
        return true
      }
      const driver = drivers.find((d) => String(d.id) === option.value)
      return isDriverAdrValid(driver)
    })
  }, [driverAvailabilityQuery.data, driverOptions, hasHazardousCargo, drivers])

  useEffect(() => {
    if (!selectedVehicleId) {
      return
    }
    const stillAvailable = filteredVehicleOptions.some(
      (option) => option.value === selectedVehicleId,
    )
    if (!stillAvailable) {
      setVehicleId('')
    }
  }, [filteredVehicleOptions, selectedVehicleId, setVehicleId])

  useEffect(() => {
    if (!selectedDriverId) {
      return
    }
    const stillAvailable = filteredDriverOptions.some(
      (option) => option.value === selectedDriverId,
    )
    if (!stillAvailable) {
      setDriverId('')
    }
  }, [filteredDriverOptions, selectedDriverId, setDriverId])

  return {
    vehicleOptions: filteredVehicleOptions,
    driverOptions: filteredDriverOptions,
    isCheckingAvailability:
      vehicleAvailabilityQuery.isFetching || driverAvailabilityQuery.isFetching,
  }
}

