import { useMemo } from 'react'
import { ChangelogDiffFields } from '@/components/changelog/ChangelogDiffFields'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { useChangelog } from '@/hooks/changelog/useChangelog'
import { formatDateTime } from '@/utils/date'

type RecordChangelogModalProps = {
  open: boolean
  title: string
  tableName: string
  recordId: number
  onClose: () => void
}

export function RecordChangelogModal({
  open,
  title,
  tableName,
  recordId,
  onClose,
}: RecordChangelogModalProps) {
  const { changelogQuery } = useChangelog({
    endpoint: '/api/v1/changelog',
    enabled: open,
    page: 1,
    limit: 100,
    userId: '',
    recordId,
    tableName,
    operation: '',
    dateFrom: '',
    dateTo: '',
  })

  const rows = useMemo(() => changelogQuery.data?.data ?? [], [changelogQuery.data])

  if (!open) {
    return null
  }

  return (
    <Modal title={title} contentClassName="max-w-5xl">
      <div className="mt-4 flex flex-col" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
        {changelogQuery.isLoading && <LoadingMessage message="Loading record history..." />}
        {changelogQuery.isError && <ErrorMessage message="Failed to load record history." />}

        {changelogQuery.isSuccess && rows.length === 0 && (
          <p className="text-sm text-gray-500">No changes recorded for this record yet.</p>
        )}

        {changelogQuery.isSuccess && rows.length > 0 && (
          <ol className="scrollbar-styled flex-1 space-y-3 overflow-y-auto pr-1">
            {rows.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {entry.operation} by {entry.username ?? `User #${entry.userId ?? '-'}`}
                  </p>
                  <p className="text-xs text-gray-500">{formatDateTime(entry.timestamp)}</p>
                </div>
                <ChangelogDiffFields
                  oldData={entry.oldData}
                  newData={entry.newData}
                />
              </li>
            ))}
          </ol>
        )}

        <div className="flex justify-start border-t border-gray-100 pt-3 sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
