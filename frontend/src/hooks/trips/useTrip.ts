import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import type { Trip } from './useTrips'

export function useTrip(tripId: number | null) {
  const tripQuery = useQuery({
    queryKey: ['trips', tripId],
    queryFn: async () => {
      if (!tripId || tripId <= 0) return null
      const res = await api.get<Trip>(`/api/v1/trips/${tripId}`)
      return res.data
    },
    enabled: tripId != null && tripId > 0,
  })

  return {
    tripQuery,
    trip: tripQuery.data ?? null,
  }
}

