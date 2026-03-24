import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

export type FuelLog = {
  id: number
  vehicle_id: number
  date: string
  liters: number
  price_per_liter: number
  total_cost: number
  mileage: number
  location: string
  created_at?: string
  has_alert: boolean
}

export type ListFuelLogsResponse = {
  data: FuelLog[]
  page: number
  limit: number
  total: number
}

export type UseFuelLogsParams = {
  page: number
  limit: number
  vehicleId: string
  dateFrom: string
  dateTo: string
}

export type CreateFuelPayload = {
  vehicle_id: number
  date: string
  liters: number
  price_per_liter: number
  mileage: number
  location: string
}

export function useFuelLogs({ page, limit, vehicleId, dateFrom, dateTo }: UseFuelLogsParams) {
  const queryClient = useQueryClient()

  const fuelLogsQuery = useQuery({
    queryKey: ['fuel-logs', { page, limit, vehicleId, dateFrom, dateTo }],
    queryFn: async () => {
      const res = await api.get<ListFuelLogsResponse>('/api/v1/fuel', {
        params: {
          page,
          limit,
          vehicle_id: vehicleId || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      })
      return res.data
    },
  })

  const createFuelLogMutation = useMutation({
    mutationFn: async (payload: CreateFuelPayload) => {
      const res = await api.post('/api/v1/fuel', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })

  return { fuelLogsQuery, createFuelLogMutation }
}

