import { Fragment, useCallback, useState } from 'react'
import { ChangelogDiffFields } from '@/components/changelog/ChangelogDiffFields'
import { ChangelogOperationBadge } from '@/components/changelog/ChangelogOperationBadge'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import type { ChangelogEntry } from '@/hooks/changelog/useChangelog'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { formatDateTime } from '@/utils/date'

type ChangelogTableProps = {
  rows: ChangelogEntry[]
  page: number
  total: number
  pagination: Pick<
    PaginationHelpers,
    'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'
  >
}

export function ChangelogTable({ rows, page, total, pagination }: ChangelogTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const toggleRow = useCallback((id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Timestamp</th>
                <th className="px-4 py-3 font-medium text-gray-700">User</th>
                <th className="px-4 py-3 font-medium text-gray-700">Table</th>
                <th className="px-4 py-3 font-medium text-gray-700">Record ID</th>
                <th className="px-4 py-3 font-medium text-gray-700">Operation</th>
                <th className="px-4 py-3 font-medium text-gray-700">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((row) => {
                const isExpanded = expandedId === row.id

                return (
                  <Fragment key={row.id}>
                    <tr
                      role="button"
                      tabIndex={0}
                      title="Click row to show or hide change details"
                      className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-slate-400"
                      onClick={() => toggleRow(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleRow(row.id)
                        }
                      }}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatDateTime(row.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.username ?? (row.userId != null ? `#${row.userId}` : '—')}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{row.tableName}</td>
                      <td className="px-4 py-3 text-gray-700">{row.recordId}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <ChangelogOperationBadge operation={row.operation} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-sm font-medium text-slate-700 underline hover:text-slate-900"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleRow(row.id)
                          }}
                        >
                          {isExpanded ? 'Hide' : 'Show'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={6} className="px-4 py-3">
                          <ChangelogDiffFields
                            oldData={row.oldData}
                            newData={row.newData}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DataTablePagination>
  )
}
