import { Fragment, useState } from 'react'
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

const operationBadgeClass = (operation: string) => {
  switch (operation) {
    case 'INSERT':
      return 'bg-green-100 text-green-700'
    case 'UPDATE':
      return 'bg-amber-100 text-amber-700'
    case 'DELETE':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export function ChangelogTable({ rows, page, total, pagination }: ChangelogTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Timestamp</th>
                <th className="px-4 py-3 font-medium text-gray-700">User ID</th>
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
                    <tr>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatDateTime(row.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{row.userId ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-700">{row.tableName}</td>
                      <td className="px-4 py-3 text-gray-700">{row.recordId}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${operationBadgeClass(
                            row.operation,
                          )}`}
                        >
                          {row.operation}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-sm font-medium text-slate-700 underline"
                          onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        >
                          {isExpanded ? 'Hide' : 'Show'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Old data
                              </p>
                              <pre className="max-h-64 overflow-auto rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-700">
                                {JSON.stringify(row.oldData ?? null, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                New data
                              </p>
                              <pre className="max-h-64 overflow-auto rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-700">
                                {JSON.stringify(row.newData ?? null, null, 2)}
                              </pre>
                            </div>
                          </div>
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
