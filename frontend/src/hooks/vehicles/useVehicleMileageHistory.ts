import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export type MileageHistoryItem = {
  date: string
  mileage: number
}

export function useVehicleMileageHistory(vehicleId: number) {
  const mileageHistoryQuery = useQuery({
    queryKey: ['vehicleMileageHistory', vehicleId],
    enabled: Number.isFinite(vehicleId) && vehicleId > 0,
    queryFn: async () => {
      const res = await api.get<MileageHistoryItem[]>(
        `/api/v1/vehicles/${vehicleId}/mileage-history`,
      )
      return res.data
    },
  })

  return { mileageHistoryQuery }
}
