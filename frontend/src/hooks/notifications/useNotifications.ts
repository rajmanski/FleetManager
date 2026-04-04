import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { fetchNotifications } from '@/services/notifications'
import type { Notification } from '@/types/notifications'

export function isNotificationUnread(n: Notification): boolean {
  return n.is_read !== true
}

export function useNotifications() {
  const listQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
  })

  const unreadCount = useMemo(() => {
    if (!listQuery.data) return 0
    return listQuery.data.filter(isNotificationUnread).length
  }, [listQuery.data])

  return {
    listQuery,
    unreadCount,
  }
}
