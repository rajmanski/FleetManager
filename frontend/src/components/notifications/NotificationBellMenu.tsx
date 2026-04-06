import { useCallback, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { NotificationStatusBadge } from '@/components/notifications/NotificationStatusBadge'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { useDismissOnOutsideClickAndEscape } from '@/hooks/useDismissOnOutsideClickAndEscape'
import { useNotifications } from '@/hooks/notifications/useNotifications'
import { formatDateTime } from '@/utils/date'
import { formatNotificationTypeLabel, isNotificationUnread } from '@/utils/notifications'

export function NotificationBellMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { listQuery, unreadCount } = useNotifications()

  const handleDismiss = useCallback(() => setOpen(false), [])
  useDismissOnOutsideClickAndEscape(open, rootRef, handleDismiss)

  const handleToggle = () => {
    setOpen((v) => !v)
  }

  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        onClick={handleToggle}
        className="relative rounded-lg p-2 hover:bg-gray-100"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="size-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[1.125rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
            {badgeText}
          </span>
        )}
      </Button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white shadow-lg"
          role="region"
          aria-label="Notification list"
        >
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-sm font-medium text-gray-900">Notifications</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {listQuery.isLoading && (
              <div className="px-3 py-6">
                <LoadingMessage message="Loading…" />
              </div>
            )}

            {listQuery.isError && (
              <div className="px-3 py-3">
                <ErrorMessage message="Could not load notifications." />
              </div>
            )}

            {listQuery.isSuccess && listQuery.data.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-gray-500">No notifications yet.</p>
            )}

            {listQuery.isSuccess && (
              <ul className="list-none">
                {listQuery.data.map((n) => {
                  const unread = isNotificationUnread(n)
                  return (
                    <li
                      key={n.id}
                      className={`border-b border-gray-100 px-3 py-2.5 last:border-b-0 ${
                        unread ? 'bg-slate-50 font-medium text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-wide text-slate-600">
                          {formatNotificationTypeLabel(n.type)}
                        </span>
                        <NotificationStatusBadge unread={unread} variant="bell" />
                      </div>
                      {n.message ? (
                        <p className="mt-0.5 line-clamp-3 text-sm">{n.message}</p>
                      ) : (
                        <p className="mt-0.5 text-sm text-gray-400">—</p>
                      )}
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatDateTime(n.created_at ?? undefined)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
