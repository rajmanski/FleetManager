import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import type { CargoPayload } from '@/schemas/cargo'

export type Cargo = {
  id: number
  orderId: number
  description?: string
  weightKg: number
  volumeM3: number
  cargoType: string
  destinationWaypointId?: number | null
}

type ListCargoResponse = {
  data: Cargo[]
}

export function useCargo(orderId: number | null) {
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: ['cargo', orderId],
    queryFn: async () => {
      if (!orderId) return { data: [] }
      const res = await api.get<ListCargoResponse>(`/api/v1/orders/${orderId}/cargo`)
      return res.data
    },
    enabled: orderId != null && orderId > 0,
  })

  const createMutation = useMutation({
    mutationFn: async ({
      orderId: oid,
      payload,
    }: {
      orderId: number
      payload: CargoPayload
    }) => {
      const body = {
        description: payload.description || '',
        weightKg: payload.weightKg,
        volumeM3: payload.volumeM3,
        cargoType: payload.cargoType,
      }
      const res = await api.post<Cargo>(`/api/v1/orders/${oid}/cargo`, body)
      return res.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cargo', variables.orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async ({
      cargoId,
      orderId: oid,
    }: {
      cargoId: number
      orderId: number
    }) => {
      await api.delete(`/api/v1/cargo/${cargoId}`)
      return { cargoId, orderId: oid }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cargo', variables.orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  return {
    listQuery,
    createMutation,
    deleteMutation,
  }
}
