import { useMemo, useState } from 'react'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { formatPrice } from '@/utils/price'
import { useVehicleMaintenanceHistory } from '@/hooks/vehicles/useVehicleMaintenanceHistory'
import { MaintenanceTypeBadge } from '@/components/maintenance/MaintenanceTypeBadge'

type MaintenanceHistorySectionProps = {
  vehicleId: number
}

const dateRangeLabel = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return '-'
  if (!startDate) return '-'
  if (!endDate) return `${startDate} - -`
  return `${startDate} - ${endDate}`
}

export function MaintenanceHistorySection({ vehicleId }: MaintenanceHistorySectionProps) {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { maintenanceHistoryQuery } = useVehicleMaintenanceHistory({
    vehicleId,
    type: typeFilter,
    status: statusFilter,
  })

  const rows = maintenanceHistoryQuery.data ?? []

  const totalCost = useMemo(() => {
    return rows.reduce((acc, r) => acc + (r.total_cost_pln ?? 0), 0)
  }, [rows])

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-base font-semibold text-gray-800">Fixing history</h3>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <FilterSelect
          label="Typ"
          value={typeFilter}
          onChange={setTypeFilter}
          options={['Routine', 'Repair', 'TireChange']}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={['Scheduled', 'InProgress', 'Completed']}
        />
      </div>

      {maintenanceHistoryQuery.isLoading && <LoadingMessage />}
      {maintenanceHistoryQuery.isError && (
        <ErrorMessage message="Failed to load maintenance history." />
      )}

      {maintenanceHistoryQuery.isSuccess && (
        <>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500">No maintenance history.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-700">Data</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Typ</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Koszt całkowity</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Opis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rows.map((row) => (
                    <tr key={row.maintenance_id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {dateRangeLabel(row.start_date, row.end_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <MaintenanceTypeBadge type={row.type} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.status}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatPrice(row.total_cost_pln)}</td>
                      <td className="px-4 py-3">{row.description ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <span className="font-medium text-gray-800">Total maintenance costs:</span>{' '}
            {formatPrice(totalCost)}
          </div>
        </>
      )}
    </div>
  )
}

