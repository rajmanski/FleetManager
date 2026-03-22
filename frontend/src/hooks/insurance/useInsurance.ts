import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

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

export type ListInsuranceResponse = {
  data: InsurancePolicy[]
  page: number
  limit: number
  total: number
}

export type UseInsuranceListParams = {
  page: number
  limit: number
  vehicleId: string
}

export function useInsuranceList({ page, limit, vehicleId }: UseInsuranceListParams) {
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

  return { insuranceQuery }
}
