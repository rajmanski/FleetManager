import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export type MaintenanceHistoryItem = {
  maintenance_id: number
  type: string
  status: string
  start_date?: string
  end_date?: string
  parts_cost_pln: number
  labor_cost_pln: number
  total_cost_pln: number
  description?: string
}

type UseVehicleMaintenanceHistoryParams = {
  vehicleId: number
  type: string
  status: string
}

export function useVehicleMaintenanceHistory({
  vehicleId,
  type,
  status,
}: UseVehicleMaintenanceHistoryParams) {
  const maintenanceHistoryQuery = useQuery({
    queryKey: ['vehicleMaintenanceHistory', { vehicleId, type, status }],
    enabled: Number.isFinite(vehicleId) && vehicleId > 0,
    queryFn: async () => {
      const res = await api.get<MaintenanceHistoryItem[]>(
        `/api/v1/vehicles/${vehicleId}/maintenance-history`,
        {
          params: {
            type: type || undefined,
            status: status || undefined,
          },
        },
      )
      return res.data
    },
  })

  return { maintenanceHistoryQuery }
}

