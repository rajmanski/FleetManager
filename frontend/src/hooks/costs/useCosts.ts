import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export type CreateCostPayload = {
  vehicleId: number
  category: 'Tolls' | 'Other'
  amount: number
  date: string
  description?: string
  invoiceNumber?: string
}

export function useCosts({ page, limit, vehicleId, category }: UseCostsParams) {
  const queryClient = useQueryClient()

  const costsQuery = useQuery({
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

  const createCostMutation = useMutation({
    mutationFn: async (payload: CreateCostPayload) => {
      const res = await api.post<Cost>('/api/v1/costs', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] })
    },
  })

  return { costsQuery, createCostMutation }
}

