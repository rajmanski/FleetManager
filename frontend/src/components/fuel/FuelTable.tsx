import { Truck, Calendar, Droplets, DollarSign, Gauge, Flame, AlertTriangle } from 'lucide-react'
import type { FuelLog } from '@/hooks/fuel/useFuel'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { EntityCellLink } from '@/components/ui/EntityCellLink'
import { ThWithIcon } from '@/components/ui/ThWithIcon'
import { formatDateOnly } from '@/utils/date'
import { Tooltip } from '@/components/ui/Tooltip'

type FuelTableProps = {
  rows: FuelLog[]
  page: number
  total: number
  pagination: Pick<
    PaginationHelpers,
    'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'
  >
  vehicleLabelsById: Record<number, string>
}

const formatNumber = (value: number) =>
  value.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const formatOneDecimal = (value: number) =>
  value.toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function FuelTable({ rows, page, total, pagination, vehicleLabelsById }: FuelTableProps) {
  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <ThWithIcon icon={Truck}>Vehicle</ThWithIcon>
                <ThWithIcon icon={Calendar}>Date</ThWithIcon>
                <ThWithIcon icon={Droplets}>Liters</ThWithIcon>
                <ThWithIcon icon={DollarSign}>Cost (PLN)</ThWithIcon>
                <ThWithIcon icon={Gauge}>Mileage</ThWithIcon>
                <ThWithIcon icon={Flame}>Spalanie</ThWithIcon>
                <ThWithIcon icon={AlertTriangle}>Alert</ThWithIcon>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.is_anomaly ? 'bg-red-50' : 'bg-white'}
                >
                  <td className="px-4 py-3">
                    <EntityCellLink to={`/vehicles/${row.vehicle_id}`}>
                      {vehicleLabelsById[row.vehicle_id] ?? `#${row.vehicle_id}`}
                    </EntityCellLink>
                  </td>
                  <td className="px-4 py-3">{formatDateOnly(row.date)}</td>
                  <td className="px-4 py-3">{formatNumber(row.liters)}</td>
                  <td className="px-4 py-3">{formatNumber(row.total_cost)}</td>
                  <td className="px-4 py-3">{row.mileage.toLocaleString('pl-PL')}</td>
                  <td className="px-4 py-3">{formatOneDecimal(row.consumption_per_100km)}</td>
                  <td className="px-4 py-3">
                    {row.is_anomaly ? (
                      <Tooltip
                        content={`Spalanie: ${formatOneDecimal(row.consumption_per_100km)} l/100km (średnia: ${formatOneDecimal(row.avg_consumption_per_100km)} l/100km, odchylenie: +${formatOneDecimal(row.deviation_percent)}%)`}
                      >
                        <span aria-label="Fuel anomaly warning" className="inline-block">
                          ⚠️
                        </span>
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DataTablePagination>
  )
}

