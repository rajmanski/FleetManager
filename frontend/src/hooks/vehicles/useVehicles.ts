import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import api from '@/services/api'
import type { PaginatedResponse } from '@/types/common'

export type Vehicle = {
  id: number
  vin: string
  plate_number?: string
  brand?: string
  model?: string
  production_year?: number
  capacity_kg?: number
  current_mileage_km?: number
  status: string
  deleted_at?: string
  created_at?: string
  updated_at?: string
}

export type VehicleMutationPayload = {
  vin: string
  plate_number?: string
  brand: string
  model: string
  production_year: number
  capacity_kg?: number
  current_mileage_km: number
}

type ListVehiclesResponse = PaginatedResponse<Vehicle>

type UseVehiclesParams = {
  page: number
  limit: number
  statusFilter: string
  search: string
  showDeleted: boolean
}

export function useVehicles({
  page,
  limit,
  statusFilter,
  search,
  showDeleted,
}: UseVehiclesParams) {
  const queryClient = useQueryClient()
  const { isAdmin } = useAuth()

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { showDeleted, statusFilter, search, page, limit }],
    queryFn: async () => {
      const res = await api.get<ListVehiclesResponse>('/api/v1/vehicles', {
        params: {
          page,
          limit,
          status: statusFilter,
          q: search.trim(),
          include_deleted: isAdmin && showDeleted ? 'true' : 'false',
        },
      })
      return res.data
    },
  })

  const restoreMutation = useMutation({
    mutationFn: async (vehicleID: number) => {
      const res = await api.put<Vehicle>(`/api/v1/vehicles/${vehicleID}/restore`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: VehicleMutationPayload) => {
      const res = await api.post<Vehicle>('/api/v1/vehicles', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number
      payload: VehicleMutationPayload & { status: string }
    }) => {
      const res = await api.put<Vehicle>(`/api/v1/vehicles/${id}`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })

  return {
    vehiclesQuery,
    restoreMutation,
    createMutation,
    updateMutation,
    isAdmin,
  }
}
