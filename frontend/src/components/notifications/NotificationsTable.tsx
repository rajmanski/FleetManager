import {
  Bell,
  CalendarClock,
  CircleCheckBig,
  FileText,
  Wrench,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { NotificationStatusBadge } from '@/components/notifications/NotificationStatusBadge'
import {
  extractVehicleVin,
  notificationDetailsPath,
  notificationTypeIcon,
} from '@/components/notifications/notificationsTable.helpers'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { Button } from '@/components/ui/Button'
import type { Notification } from '@/types/notifications'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { formatDateTime } from '@/utils/date'
import { formatNotificationTypeLabel, isNotificationUnread } from '@/utils/notifications'

type NotificationsTableProps = {
  rows: Notification[]
  page: number
  total: number
  pagination: Pick<PaginationHelpers, 'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'>
  markingId: number | null
  onMarkRead: (id: number) => void
}

export function NotificationsTable({
  rows,
  page,
  total,
  pagination,
  markingId,
  onMarkRead,
}: NotificationsTableProps) {
  const navigate = useNavigate()

  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Bell className="size-4 text-slate-600" aria-hidden="true" />
                    Type
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="size-4 text-slate-600" aria-hidden="true" />
                    Message
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4 text-slate-600" aria-hidden="true" />
                    Created
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <CircleCheckBig className="size-4 text-slate-600" aria-hidden="true" />
                    Status
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Wrench className="size-4 text-slate-600" aria-hidden="true" />
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => {
                const unread = isNotificationUnread(row)
                const targetPath = notificationDetailsPath(row.type)
                const vehicleVin = extractVehicleVin(row.message)
                const rowClassName = unread
                  ? 'bg-slate-50 transition-colors hover:bg-slate-100 focus-within:bg-slate-100'
                  : 'bg-white transition-colors hover:bg-gray-50 focus-within:bg-gray-50'

                return (
                  <tr
                    key={row.id}
                    className={`${rowClassName} cursor-pointer`}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open related details for notification: ${formatNotificationTypeLabel(row.type)}`}
                    onClick={() => navigate(targetPath)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(targetPath)
                      }
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {notificationTypeIcon(row.type)}
                        <span>{formatNotificationTypeLabel(row.type)}</span>
                      </div>
                    </td>
                    <td className="max-w-md px-4 py-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <span>{row.message ?? '—'}</span>
                        {vehicleVin ? (
                          <Link
                            to="/vehicles"
                            className="text-xs font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                            aria-label={`Open vehicles view for VIN ${vehicleVin}`}
                          >
                            Vehicle {vehicleVin}
                          </Link>
                        ) : null}
                      </div>
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
                          onClick={(event) => {
                            event.stopPropagation()
                            onMarkRead(row.id)
                          }}
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
    </DataTablePagination>
  )
}
