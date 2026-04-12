import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DictionaryEntryFormValues } from '@/schemas/dictionaries'
import api from '@/services/api'

export type DictionaryEntry = {
  id: number
  category: string
  key: string
  value: string
  created_at: string
}

export function useDictionaries(category: string | null) {
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: ['admin', 'dictionaries', category],
    queryFn: async () => {
      const res = await api.get<DictionaryEntry[]>('/api/v1/admin/dictionaries', {
        params: { category },
      })
      return res.data
    },
    enabled: Boolean(category && category.length > 0),
  })

  const createMutation = useMutation({
    mutationFn: async (payload: { category: string } & DictionaryEntryFormValues) => {
      const res = await api.post<DictionaryEntry>('/api/v1/admin/dictionaries', {
        category: payload.category,
        key: payload.key,
        value: payload.value,
      })
      return res.data
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'dictionaries', variables.category],
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: number
      category: string
      key: string
      value: string
    }) => {
      const res = await api.put<DictionaryEntry>(
        `/api/v1/admin/dictionaries/${payload.id}`,
        {
          category: payload.category,
          key: payload.key,
          value: payload.value,
        },
      )
      return res.data
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'dictionaries', variables.category],
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (payload: { id: number; category: string }) => {
      await api.delete(`/api/v1/admin/dictionaries/${payload.id}`)
      return payload.category
    },
    onSuccess: (cat) => {
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'dictionaries', cat],
      })
    },
  })

  return {
    listQuery,
    createMutation,
    updateMutation,
    deleteMutation,
  }
}
