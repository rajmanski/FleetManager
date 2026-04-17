import api from '@/services/api'
import type { Notification } from '@/types/notifications'

type NullStringDTO = { String: string; Valid: boolean }
type NullBoolDTO = { Bool: boolean; Valid: boolean }
type NullTimeDTO = { Time: string; Valid: boolean }

type NotificationDTO = {
  id: number
  user_id: number
  type: string
  message: NullStringDTO
  is_read: NullBoolDTO
  created_at: NullTimeDTO
}

function normalizeNotification(item: NotificationDTO): Notification {
  return {
    id: item.id,
    user_id: item.user_id,
    type: item.type,
    message: item.message.Valid ? item.message.String : null,
    is_read: item.is_read.Valid ? item.is_read.Bool : null,
    created_at: item.created_at.Valid ? item.created_at.Time : null,
  }
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data } = await api.get<NotificationDTO[]>('/api/v1/notifications')
  return data.map(normalizeNotification)
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  await api.patch(`/api/v1/notifications/${notificationId}/read`)
}
