import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import api from '@/services/api'

export type Client = {
  id: number
  companyName: string
  nip: string
  address?: string
  contactEmail?: string
  deletedAt?: string
  createdAt?: string
}

export type ClientMutationPayload = {
  companyName: string
  nip: string
  address?: string
  contactEmail?: string
}

type ListClientsResponse = {
  data: Client[]
  page: number
  limit: number
  total: number
}

type UseClientsParams = {
  page: number
  limit: number
  search: string
  showDeleted: boolean
}

export function useClients({ page, limit, search, showDeleted }: UseClientsParams) {
  const queryClient = useQueryClient()
  const { isAdmin } = useAuth()

  const clientsQuery = useQuery({
    queryKey: ['clients', { showDeleted, search, page, limit }],
    queryFn: async () => {
      const res = await api.get<ListClientsResponse>('/api/v1/clients', {
        params: {
          page,
          limit,
          q: search.trim(),
          include_deleted: isAdmin && showDeleted ? 'true' : 'false',
        },
      })
      return res.data
    },
  })

  const restoreMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const res = await api.put<Client>(`/api/v1/clients/${clientId}/restore`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: ClientMutationPayload) => {
      const res = await api.post<Client>('/api/v1/clients', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ClientMutationPayload }) => {
      const res = await api.put<Client>(`/api/v1/clients/${id}`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  return {
    clientsQuery,
    restoreMutation,
    createMutation,
    updateMutation,
    isAdmin,
  }
}

