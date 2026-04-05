import { useCallback, useMemo, useState } from 'react'
import { NotificationsFiltersBar } from '@/components/notifications/NotificationsFiltersBar'
import { NotificationsTable } from '@/components/notifications/NotificationsTable'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { useNotifications } from '@/hooks/notifications/useNotifications'

function NotificationsPage() {
  const [typeFilter, setTypeFilter] = useState('')
  const { listQuery, markReadMutation } = useNotifications()

  const markCallbacks = useMutationCallbacks({
    successMessage: 'Marked as read',
    errorFallback: 'Failed to mark notification as read',
  })

  const rows = useMemo(() => {
    const data = listQuery.data ?? []
    if (!typeFilter) return data
    return data.filter((n) => n.type === typeFilter)
  }, [listQuery.data, typeFilter])

  const markingId =
    markReadMutation.isPending && typeof markReadMutation.variables === 'number'
      ? markReadMutation.variables
      : null

  const handleMarkRead = useCallback(
    (id: number) => {
      markReadMutation.mutate(id, {
        onSuccess: markCallbacks.onSuccess,
        onError: markCallbacks.onError,
      })
    },
    [markReadMutation, markCallbacks.onSuccess, markCallbacks.onError],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="In-app alerts for your account (inspections, insurance, certificates, fuel)"
      />

      <NotificationsFiltersBar typeFilter={typeFilter} onTypeFilterChange={setTypeFilter} />

      {listQuery.isLoading && <LoadingMessage />}
      {listQuery.isError && <ErrorMessage message="Failed to load notifications." />}

      {listQuery.isSuccess && (listQuery.data?.length ?? 0) === 0 && (
        <p className="text-sm text-gray-500">No notifications yet.</p>
      )}

      {listQuery.isSuccess &&
        (listQuery.data?.length ?? 0) > 0 &&
        rows.length === 0 && (
          <p className="text-sm text-gray-500">No notifications match the current filters.</p>
        )}

      {listQuery.isSuccess && rows.length > 0 && (
        <NotificationsTable rows={rows} markingId={markingId} onMarkRead={handleMarkRead} />
      )}
    </div>
  )
}

export default NotificationsPage
