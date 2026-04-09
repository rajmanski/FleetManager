import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export type ChangelogEntry = {
  id: number
  userId?: number
  username?: string
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
  endpoint?: '/api/v1/admin/changelog' | '/api/v1/changelog'
  enabled?: boolean
  page: number
  limit: number
  userId: string
  recordId?: number
  tableName: string
  operation: string
  dateFrom: string
  dateTo: string
}

export function useChangelog({
  endpoint = '/api/v1/admin/changelog',
  enabled = true,
  page,
  limit,
  userId,
  recordId,
  tableName,
  operation,
  dateFrom,
  dateTo,
}: UseChangelogParams) {
  const changelogQuery = useQuery({
    enabled,
    queryKey: [
      'admin',
      'changelog',
      { endpoint, page, limit, userId, recordId, tableName, operation, dateFrom, dateTo },
    ],
    queryFn: async () => {
      const res = await api.get<ChangelogListResponse>(endpoint, {
        params: {
          page,
          limit,
          user_id: userId || undefined,
          record_id: recordId || undefined,
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
