import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import api from '@/services/api'

export type Driver = {
  id: number
  first_name: string
  last_name: string
  pesel: string
  phone?: string
  email?: string
  status: string
  license_number?: string
  license_expiry_date?: string
  adr_certified?: boolean
  adr_expiry_date?: string
  deleted_at?: string
  created_at?: string
  updated_at?: string
}

export type DriverMutationPayload = {
  first_name: string
  last_name: string
  pesel: string
  phone?: string
  email?: string
  status: string
  license_number?: string
  license_expiry_date?: string
  adr_certified?: boolean
  adr_expiry_date?: string
}

type ListDriversResponse = {
  data: Driver[]
  page: number
  limit: number
  total: number
}

type UseDriversParams = {
  page: number
  limit: number
  statusFilter: string
  search: string
  showDeleted: boolean
}

export function useDrivers({
  page,
  limit,
  statusFilter,
  search,
  showDeleted,
}: UseDriversParams) {
  const queryClient = useQueryClient()
  const { isAdmin } = useAuth()

  const driversQuery = useQuery({
    queryKey: ['drivers', { showDeleted, statusFilter, search, page, limit }],
    queryFn: async () => {
      const res = await api.get<ListDriversResponse>('/api/v1/drivers', {
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
    mutationFn: async (driverId: number) => {
      const res = await api.put<Driver>(`/api/v1/drivers/${driverId}/restore`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: DriverMutationPayload) => {
      const res = await api.post<Driver>('/api/v1/drivers', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number
      payload: DriverMutationPayload
    }) => {
      const res = await api.put<Driver>(`/api/v1/drivers/${id}`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    },
  })

  const softDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/api/v1/drivers/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    },
  })

  return {
    driversQuery,
    restoreMutation,
    createMutation,
    updateMutation,
    softDeleteMutation,
    isAdmin,
  }
}
