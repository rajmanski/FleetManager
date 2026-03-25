import type { FuelLog } from '@/hooks/fuel/useFuel'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
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
                <th className="px-4 py-3 font-medium text-gray-700">Vehicle</th>
                <th className="px-4 py-3 font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 font-medium text-gray-700">Liters</th>
                <th className="px-4 py-3 font-medium text-gray-700">Cost (PLN)</th>
                <th className="px-4 py-3 font-medium text-gray-700">Mileage</th>
                <th className="px-4 py-3 font-medium text-gray-700">Spalanie</th>
                <th className="px-4 py-3 font-medium text-gray-700">Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.is_anomaly ? 'bg-red-50' : 'bg-white'}
                >
                  <td className="px-4 py-3">
                    {vehicleLabelsById[row.vehicle_id] ?? `#${row.vehicle_id}`}
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

