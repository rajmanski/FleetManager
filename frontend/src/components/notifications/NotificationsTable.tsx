import { NotificationStatusBadge } from '@/components/notifications/NotificationStatusBadge'
import { Button } from '@/components/ui/Button'
import type { Notification } from '@/types/notifications'
import { formatDateTime } from '@/utils/date'
import { formatNotificationTypeLabel, isNotificationUnread } from '@/utils/notifications'

type NotificationsTableProps = {
  rows: Notification[]
  markingId: number | null
  onMarkRead: (id: number) => void
}

export function NotificationsTable({ rows, markingId, onMarkRead }: NotificationsTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Type</th>
              <th className="px-4 py-3 font-medium text-gray-700">Message</th>
              <th className="px-4 py-3 font-medium text-gray-700">Created</th>
              <th className="px-4 py-3 font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row) => {
              const unread = isNotificationUnread(row)
              return (
                <tr
                  key={row.id}
                  className={unread ? 'bg-slate-50' : 'bg-white'}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatNotificationTypeLabel(row.type)}
                  </td>
                  <td className="max-w-md px-4 py-3 text-gray-700">
                    {row.message ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {formatDateTime(row.created_at ?? undefined)}
                  </td>
                  <td className="px-4 py-3">
                    <NotificationStatusBadge unread={unread} variant="table" />
                  </td>
                  <td className="px-4 py-3">
                    {unread ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        disabled={markingId === row.id}
                        onClick={() => onMarkRead(row.id)}
                      >
                        {markingId === row.id ? 'Marking…' : 'Mark as read'}
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
