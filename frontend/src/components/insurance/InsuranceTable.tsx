import { Truck, Shield, FileText, DollarSign, Calendar } from 'lucide-react'
import type { InsurancePolicy } from '@/hooks/insurance/useInsurance'
import type { PaginationHelpers } from '@/hooks/usePagination'
import type { SortConfig } from '@/components/ui/SortableTh'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { EntityCellLink } from '@/components/ui/EntityCellLink'
import { ThWithIcon } from '@/components/ui/ThWithIcon'
import { SortableTh } from '@/components/ui/SortableTh'
import { formatDateOnly, getInsuranceExpiryStatus } from '@/utils/date'
import { formatPrice } from '@/utils/price'

type InsuranceTableProps = {
  rows: InsurancePolicy[]
  page: number
  total: number
  pagination: Pick<
    PaginationHelpers,
    'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'
  >
  vehicleLabelsById: Record<number, string>
  sortConfig: SortConfig
  onSort: (column: string) => void
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
  sortConfig,
  onSort,
}: InsuranceTableProps) {
  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <SortableTh column="vehicleId" sortConfig={sortConfig} onSort={onSort} icon={Truck}>Vehicle</SortableTh>
                <SortableTh column="type" sortConfig={sortConfig} onSort={onSort} icon={Shield}>Type</SortableTh>
                <SortableTh column="policyNumber" sortConfig={sortConfig} onSort={onSort} icon={FileText}>Policy number</SortableTh>
                <SortableTh column="cost" sortConfig={sortConfig} onSort={onSort} icon={DollarSign}>Cost</SortableTh>
                <SortableTh column="endDate" sortConfig={sortConfig} onSort={onSort} icon={Calendar}>Valid until</SortableTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id} className={rowClassForExpiry(row.endDate)}>
                  <td className="px-4 py-3">
                    <EntityCellLink to={`/vehicles/${row.vehicleId}`}>
                      {vehicleLabelsById[row.vehicleId] ?? `#${row.vehicleId}`}
                    </EntityCellLink>
                  </td>
                  <td className="px-4 py-3">{row.type}</td>
                  <td className="px-4 py-3">{row.policyNumber}</td>
                  <td className="px-4 py-3 tabular-nums">{formatPrice(row.cost)}</td>
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
