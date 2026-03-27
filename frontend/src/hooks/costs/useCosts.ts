import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export type Cost = {
  id: number
  vehicleId: number
  category: string
  amount: number
  date: string
}

export type ListCostsResponse = {
  data: Cost[]
  page: number
  limit: number
  total: number
}

export type UseCostsParams = {
  page: number
  limit: number
  vehicleId: string
  category: string
}

export function useCosts({ page, limit, vehicleId, category }: UseCostsParams) {
  return useQuery({
    queryKey: ['costs', { page, limit, vehicleId, category }],
    queryFn: async () => {
      const res = await api.get<ListCostsResponse>('/api/v1/costs', {
        params: {
          page,
          limit,
          vehicle_id: vehicleId || undefined,
          category: category || undefined,
        },
      })
      return res.data
    },
  })
}

