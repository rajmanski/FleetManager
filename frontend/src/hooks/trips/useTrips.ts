import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import api from '@/services/api'

export type Trip = {
  id: number
  order_id: number
  order_number: string
  client_company: string
  vehicle_id: number
  vehicle_vin: string
  driver_id: number
  driver_name: string
  planned_distance_km?: number
  start_time?: string
  end_time?: string
  actual_distance_km?: number
  status: string
}

export type CreateTripPayload = {
  order_id: number
  vehicle_id: number
  driver_id: number
  start_time: string
}

export type UseTripsListParams = {
  status: string
}

function invalidateTripQueries(queryClient: QueryClient, orderId?: number) {
  queryClient.invalidateQueries({ queryKey: ['trips'] })
  queryClient.invalidateQueries({ queryKey: ['orders'] })
  if (orderId) {
    queryClient.invalidateQueries({ queryKey: ['orders', orderId, 'trips'] })
  }
}

export function useTrips() {
  const queryClient = useQueryClient()

  const createTripMutation = useMutation({
    mutationFn: async (payload: CreateTripPayload) => {
      const res = await api.post<Trip>('/api/v1/trips', payload)
      return res.data
    },
    onSuccess: (_data, variables) => {
      invalidateTripQueries(queryClient, variables.order_id)
    },
  })

  const startTripMutation = useMutation({
    mutationFn: async (tripId: number) => {
      const res = await api.patch<Trip>(`/api/v1/trips/${tripId}/start`)
      return res.data
    },
    onSuccess: () => {
      invalidateTripQueries(queryClient)
    },
  })

  const finishTripMutation = useMutation({
    mutationFn: async (args: { tripId: number; actualDistanceKm: number }) => {
      const res = await api.patch<Trip>(`/api/v1/trips/${args.tripId}/finish`, {
        actual_distance_km: args.actualDistanceKm,
      })
      return res.data
    },
    onSuccess: () => {
      invalidateTripQueries(queryClient)
    },
  })

  const abortTripMutation = useMutation({
    mutationFn: async (tripId: number) => {
      const res = await api.patch<Trip>(`/api/v1/trips/${tripId}/abort`)
      return res.data
    },
    onSuccess: () => {
      invalidateTripQueries(queryClient)
    },
  })

  return {
    createTripMutation,
    startTripMutation,
    finishTripMutation,
    abortTripMutation,
  }
}

export function useTripsList({ status }: UseTripsListParams) {
  const tripsQuery = useQuery({
    queryKey: ['trips', { status }],
    queryFn: async () => {
      const res = await api.get<Trip[]>('/api/v1/trips', {
        params: {
          status: status || undefined,
        },
      })
      return res.data
    },
  })

  return {
    tripsQuery,
  }
}
