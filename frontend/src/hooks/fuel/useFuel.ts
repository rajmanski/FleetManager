import { useQuery } from '@tanstack/react-query'
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

export function useFuelLogs({ page, limit, vehicleId, dateFrom, dateTo }: UseFuelLogsParams) {
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

  return { fuelLogsQuery }
}

