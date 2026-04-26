import type { Maintenance, MaintenanceStatus } from '@/hooks/maintenance/useMaintenance'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { formatDateTime } from '@/utils/date'

type MaintenanceTableProps = {
  rows: Maintenance[]
  page: number
  total: number
  pagination: Pick<
    PaginationHelpers,
    'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'
  >
  vehicleLabelsById: Record<number, string>
  updatingId: number | null
  onStatusChange: (id: number, status: MaintenanceStatus) => void
}

const formatMaintenanceDate = (row: Maintenance) => {
  if (row.startDate && row.endDate) {
    return `${formatDateTime(row.startDate)} → ${formatDateTime(row.endDate)}`
  }
  return formatDateTime(row.startDate || row.endDate)
}

export function MaintenanceTable({
  rows,
  page,
  total,
  pagination,
  vehicleLabelsById,
  updatingId,
  onStatusChange,
}: MaintenanceTableProps) {
  const nextStatus = (current: string): MaintenanceStatus | null => {
    if (current === 'Scheduled') return 'InProgress' as MaintenanceStatus
    if (current === 'InProgress') return 'Completed' as MaintenanceStatus
    return null
  }

  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Vehicle</th>
                <th className="px-4 py-3 font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 font-medium text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((row) => {
                const ns = nextStatus(row.status)
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      {vehicleLabelsById[row.vehicleId] ?? `#${row.vehicleId}`}
                    </td>
                    <td className="px-4 py-3">{row.type}</td>
                    <td className="px-4 py-3">
                      {ns ? (
                        <button
                          type="button"
                          disabled={updatingId === row.id}
                          onClick={() => onStatusChange(row.id, ns)}
                          className="rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50
                            bg-slate-100 text-slate-700 hover:bg-slate-200
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                        >
                          {updatingId === row.id ? '...' : row.status}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">{row.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatMaintenanceDate(row) || '-'}</td>
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

