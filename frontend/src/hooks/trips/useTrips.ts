import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

export type Trip = {
  id: number
  order_id: number
  order_number: string
  vehicle_id: number
  vehicle_vin: string
  driver_id: number
  driver_name: string
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

export function useTrips() {
  const queryClient = useQueryClient()

  const createTripMutation = useMutation({
    mutationFn: async (payload: CreateTripPayload) => {
      const res = await api.post<Trip>('/api/v1/trips', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })

  return {
    createTripMutation,
  }
}

