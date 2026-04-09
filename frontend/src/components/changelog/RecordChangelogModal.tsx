import { useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { useChangelog, type ChangelogEntry } from '@/hooks/changelog/useChangelog'
import { formatDateTime } from '@/utils/date'

type RecordChangelogModalProps = {
  open: boolean
  title: string
  tableName: string
  recordId: number
  onClose: () => void
}

type FlatJson = Record<string, string>

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function flattenJson(value: unknown, parentKey = ''): FlatJson {
  if (!isObject(value) && !Array.isArray(value)) {
    if (!parentKey) {
      return { value: JSON.stringify(value) }
    }
    return { [parentKey]: JSON.stringify(value) }
  }

  const out: FlatJson = {}
  const entries = Array.isArray(value) ? value.entries() : Object.entries(value)
  for (const [rawKey, rawValue] of entries) {
    const key = parentKey ? `${parentKey}.${String(rawKey)}` : String(rawKey)
    if (isObject(rawValue) || Array.isArray(rawValue)) {
      Object.assign(out, flattenJson(rawValue, key))
      continue
    }
    out[key] = JSON.stringify(rawValue)
  }
  return out
}

function renderDiffRows(entry: ChangelogEntry) {
  const oldFlat = flattenJson(entry.oldData ?? null)
  const newFlat = flattenJson(entry.newData ?? null)
  const allKeys = Array.from(new Set([...Object.keys(oldFlat), ...Object.keys(newFlat)])).sort()

  if (allKeys.length === 0) {
    return <p className="text-xs text-gray-500">No field-level changes detected.</p>
  }

  return (
    <div className="space-y-1">
      {allKeys.map((key) => {
        const oldValue = oldFlat[key]
        const newValue = newFlat[key]
        const wasAdded = oldValue === undefined && newValue !== undefined
        const wasRemoved = oldValue !== undefined && newValue === undefined
        const wasChanged = oldValue !== undefined && newValue !== undefined && oldValue !== newValue

        const toneClass = wasAdded
          ? 'border-green-200 bg-green-50'
          : wasRemoved
            ? 'border-red-200 bg-red-50'
            : wasChanged
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-gray-200 bg-white'

        return (
          <div key={`${entry.id}-${key}`} className={`rounded-md border p-2 text-xs ${toneClass}`}>
            <p className="font-semibold text-gray-800">{key}</p>
            <p className="text-gray-600">old: {oldValue ?? '—'}</p>
            <p className="text-gray-600">new: {newValue ?? '—'}</p>
          </div>
        )
      })}
    </div>
  )
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
      <div className="mt-4 space-y-4">
        {changelogQuery.isLoading && <LoadingMessage message="Loading record history..." />}
        {changelogQuery.isError && <ErrorMessage message="Failed to load record history." />}

        {changelogQuery.isSuccess && rows.length === 0 && (
          <p className="text-sm text-gray-500">No changes recorded for this record yet.</p>
        )}

        {changelogQuery.isSuccess && rows.length > 0 && (
          <ol className="space-y-3">
            {rows.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {entry.operation} by {entry.username ?? `User #${entry.userId ?? '-'}`}
                  </p>
                  <p className="text-xs text-gray-500">{formatDateTime(entry.timestamp)}</p>
                </div>
                {renderDiffRows(entry)}
              </li>
            ))}
          </ol>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
