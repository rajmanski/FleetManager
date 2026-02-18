import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import api from '@/services/api'
import type { Vehicle, VehicleMutationPayload } from './useVehicles'

export function useVehicle(vehicleID: number) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canManageVehicles: canManage } = useAuth()

  const vehicleQuery = useQuery({
    queryKey: ['vehicle', vehicleID],
    queryFn: async () => {
      const res = await api.get<Vehicle>(`/api/v1/vehicles/${vehicleID}`)
      return res.data
    },
    enabled: Number.isFinite(vehicleID) && vehicleID > 0,
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/v1/vehicles/${vehicleID}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      navigate('/vehicles', { replace: true })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: VehicleMutationPayload & { status: string }) => {
      const res = await api.put<Vehicle>(`/api/v1/vehicles/${vehicleID}`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleID] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })

  return {
    vehicleQuery,
    deleteMutation,
    updateMutation,
    canManage,
  }
}
