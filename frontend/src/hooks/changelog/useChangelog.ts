import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export type ChangelogEntry = {
  id: number
  userId?: number
  tableName: string
  recordId: number
  operation: string
  oldData?: unknown
  newData?: unknown
  timestamp?: string
}

export type ChangelogListResponse = {
  data: ChangelogEntry[]
  page: number
  limit: number
  total: number
}

type UseChangelogParams = {
  page: number
  limit: number
  userId: string
  tableName: string
  operation: string
  dateFrom: string
  dateTo: string
}

export function useChangelog({
  page,
  limit,
  userId,
  tableName,
  operation,
  dateFrom,
  dateTo,
}: UseChangelogParams) {
  const changelogQuery = useQuery({
    queryKey: [
      'admin',
      'changelog',
      { page, limit, userId, tableName, operation, dateFrom, dateTo },
    ],
    queryFn: async () => {
      const res = await api.get<ChangelogListResponse>('/api/v1/admin/changelog', {
        params: {
          page,
          limit,
          user_id: userId || undefined,
          table_name: tableName || undefined,
          operation: operation || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      })
      return res.data
    },
  })

  return { changelogQuery }
}
