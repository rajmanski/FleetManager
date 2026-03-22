import type { InsurancePolicy } from '@/hooks/insurance/useInsurance'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { formatDateOnly, getInsuranceExpiryStatus } from '@/utils/date'

type InsuranceTableProps = {
  rows: InsurancePolicy[]
  page: number
  total: number
  pagination: Pick<
    PaginationHelpers,
    'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'
  >
  vehicleLabelsById: Record<number, string>
}

function rowClassForExpiry(endDateIso: string): string {
  const status = getInsuranceExpiryStatus(endDateIso)
  if (status === 'expired') return 'bg-red-50'
  if (status === 'expiring') return 'bg-yellow-50'
  return 'bg-white'
}

export function InsuranceTable({
  rows,
  page,
  total,
  pagination,
  vehicleLabelsById,
}: InsuranceTableProps) {
  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Vehicle</th>
                <th className="px-4 py-3 font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 font-medium text-gray-700">Policy number</th>
                <th className="px-4 py-3 font-medium text-gray-700">Valid until</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id} className={rowClassForExpiry(row.endDate)}>
                  <td className="px-4 py-3">
                    {vehicleLabelsById[row.vehicleId] ?? `#${row.vehicleId}`}
                  </td>
                  <td className="px-4 py-3">{row.type}</td>
                  <td className="px-4 py-3">{row.policyNumber}</td>
                  <td className="px-4 py-3">{formatDateOnly(row.endDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DataTablePagination>
  )
}
