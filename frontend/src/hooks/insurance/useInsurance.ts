import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import type { PaginatedResponse } from '@/types/common'

export type InsurancePolicy = {
  id: number
  vehicleId: number
  type: string
  policyNumber: string
  insurer: string
  startDate: string
  endDate: string
  cost: number
  createdAt?: string
  updatedAt?: string
}

export type ListInsuranceResponse = PaginatedResponse<InsurancePolicy>

export type UseInsuranceListParams = {
  page: number
  limit: number
  vehicleId: string
}

export type CreateInsurancePayload = {
  vehicleId: number
  type: 'OC' | 'AC'
  policyNumber: string
  insurer: string
  startDate: string
  endDate: string
  cost: number
}

export function useInsuranceList({ page, limit, vehicleId }: UseInsuranceListParams) {
  const queryClient = useQueryClient()

  const insuranceQuery = useQuery({
    queryKey: ['insurance', { page, limit, vehicleId }],
    queryFn: async () => {
      const res = await api.get<ListInsuranceResponse>('/api/v1/insurance', {
        params: {
          page,
          limit,
          vehicle_id: vehicleId || undefined,
        },
      })
      return res.data
    },
  })

  const createInsuranceMutation = useMutation({
    mutationFn: async (payload: CreateInsurancePayload) => {
      const res = await api.post<InsurancePolicy>('/api/v1/insurance', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] })
    },
  })

  return { insuranceQuery, createInsuranceMutation }
}
