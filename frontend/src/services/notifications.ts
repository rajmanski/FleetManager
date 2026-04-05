import api from '@/services/api'
import type { Notification } from '@/types/notifications'

export async function fetchNotifications(): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>('/api/v1/notifications')
  return data
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  await api.patch(`/api/v1/notifications/${notificationId}/read`)
}
