import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

type DictionaryEntry = {
  id: number
  category: string
  key: string
  value: string
  created_at: string
}

export function useDictionaryValues(category: string) {
  return useQuery({
    queryKey: ['dictionaries', 'public', category],
    queryFn: async () => {
      const res = await api.get<DictionaryEntry[]>('/api/v1/dictionaries', {
        params: { category },
      })
      return res.data.map((e) => e.key)
    },
    enabled: Boolean(category),
    staleTime: 5 * 60 * 1000,
  })
}
