import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import type { Trip } from '@/hooks/trips/useTrips'

export function useOrderTrips(orderId: number | null) {
  return useQuery({
    queryKey: ['orders', orderId, 'trips'],
    queryFn: async () => {
      if (orderId == null || orderId <= 0) return []
      const res = await api.get<Trip[]>(`/api/v1/orders/${orderId}/trips`)
      return res.data
    },
    enabled: orderId != null && orderId > 0,
  })
}

export function hasBlockingTrip(trips: Trip[] | undefined): boolean {
  if (!trips || trips.length === 0) return false
  return trips.some(
    (t) => t.status === 'Scheduled' || t.status === 'Active',
  )
}
