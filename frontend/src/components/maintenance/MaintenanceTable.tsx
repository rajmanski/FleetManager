import type { Maintenance } from '@/hooks/maintenance/useMaintenance'
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
}: MaintenanceTableProps) {
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
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    {vehicleLabelsById[row.vehicleId] ?? `#${row.vehicleId}`}
                  </td>
                  <td className="px-4 py-3">{row.type}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{formatMaintenanceDate(row) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DataTablePagination>
  )
}

