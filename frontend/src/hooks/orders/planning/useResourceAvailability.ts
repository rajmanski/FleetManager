import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import type { Driver } from '@/hooks/drivers/useDrivers'
import type { Vehicle } from '@/hooks/vehicles/useVehicles'

type DateRange = { dateFrom: string; dateTo: string }

async function fetchAvailableIds<T extends { id: number }>(
  items: T[],
  buildUrl: (item: T) => string,
  dateRange: DateRange,
): Promise<Set<number>> {
  if (items.length === 0) return new Set()
  const checks = await Promise.all(
    items.map(async (item) => {
      try {
        const res = await api.get<{ available: boolean }>(buildUrl(item), {
          params: { date_from: dateRange.dateFrom, date_to: dateRange.dateTo },
        })
        return res.data.available ? item.id : null
      } catch {
        return null
      }
    }),
  )
  return new Set(checks.filter((id): id is number => id != null))
}

export function useResourceAvailability(
  vehicles: Vehicle[],
  drivers: Driver[],
  dateRange: DateRange | null,
) {
  const vehicleIds = vehicles.map((v) => v.id)
  const driverIds = drivers.map((d) => d.id)

  const vehicleAvailabilityQuery = useQuery({
    queryKey: ['order-planning-vehicle-availability', dateRange, vehicleIds],
    queryFn: () => {
      if (!dateRange) return new Set<number>(vehicleIds)
      return fetchAvailableIds(vehicles, (v) => `/api/v1/vehicles/${v.id}/availability`, dateRange)
    },
  })

  const driverAvailabilityQuery = useQuery({
    queryKey: ['order-planning-driver-availability', dateRange, driverIds],
    queryFn: () => {
      if (!dateRange) return new Set<number>(driverIds)
      return fetchAvailableIds(drivers, (d) => `/api/v1/drivers/${d.id}/availability`, dateRange)
    },
  })

  return {
    availableVehicleIds: vehicleAvailabilityQuery.data ?? null,
    availableDriverIds: driverAvailabilityQuery.data ?? null,
    isPending: vehicleAvailabilityQuery.isFetching || driverAvailabilityQuery.isFetching,
  }
}
