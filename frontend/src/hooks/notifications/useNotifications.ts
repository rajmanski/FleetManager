import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { fetchNotifications, markNotificationRead } from '@/services/notifications'
import { isNotificationUnread } from '@/utils/notifications'

export function useNotifications() {
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
  })

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const unreadCount = useMemo(() => {
    if (!listQuery.data) return 0
    return listQuery.data.filter(isNotificationUnread).length
  }, [listQuery.data])

  return {
    listQuery,
    unreadCount,
    markReadMutation,
  }
}
