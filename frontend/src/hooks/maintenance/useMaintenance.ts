import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export type Maintenance = {
  id: number
  vehicleId: number
  startDate?: string
  endDate?: string
  type: string
  status: string
  description?: string
  laborCostPln: number
  partsCostPln: number
  totalCostPln: number
  createdAt?: string
  updatedAt?: string
}

export type ListMaintenanceResponse = {
  data: Maintenance[]
  page: number
  limit: number
  total: number
}

export type UseMaintenanceListParams = {
  page: number
  limit: number
  vehicleId: string
  status: string
}

export function useMaintenanceList({
  page,
  limit,
  vehicleId,
  status,
}: UseMaintenanceListParams) {
  const maintenanceQuery = useQuery({
    queryKey: ['maintenance', { page, limit, vehicleId, status }],
    queryFn: async () => {
      const res = await api.get<ListMaintenanceResponse>('/api/v1/maintenance', {
        params: {
          page,
          limit,
          vehicle_id: vehicleId || undefined,
          status: status || undefined,
        },
      })
      return res.data
    },
  })

  return { maintenanceQuery }
}

