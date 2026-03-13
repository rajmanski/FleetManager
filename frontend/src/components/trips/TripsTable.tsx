import type { Trip } from '@/hooks/trips/useTrips'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { formatDateTime } from '@/utils/date'
import { Link } from 'react-router-dom'

type TripsTableProps = {
  trips: Trip[]
  page: number
  total: number
  pagination: Pick<
    PaginationHelpers,
    'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'
  >
}

export function TripsTable({ trips, page, total, pagination }: TripsTableProps) {
  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Trip ID</th>
                <th className="px-4 py-3 font-medium text-gray-700">Order</th>
                <th className="px-4 py-3 font-medium text-gray-700">Client</th>
                <th className="px-4 py-3 font-medium text-gray-700">Vehicle (VIN)</th>
                <th className="px-4 py-3 font-medium text-gray-700">Driver</th>
                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 font-medium text-gray-700">Start time</th>
                <th className="px-4 py-3 font-medium text-gray-700">End time</th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  Distance (planned / actual km)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/trips/${trip.id}`}
                      className="text-slate-700 underline-offset-2 hover:underline"
                    >
                      {trip.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/orders/${trip.order_id}`}
                      className="text-slate-700 underline-offset-2 hover:underline"
                    >
                      {trip.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{trip.client_company}</td>
                  <td className="px-4 py-3">{trip.vehicle_vin}</td>
                  <td className="px-4 py-3">{trip.driver_name}</td>
                  <td className="px-4 py-3">{trip.status}</td>
                  <td className="px-4 py-3">{formatDateTime(trip.start_time)}</td>
                  <td className="px-4 py-3">{formatDateTime(trip.end_time)}</td>
                  <td className="px-4 py-3">
                    <span className="whitespace-nowrap">
                      {trip.planned_distance_km ?? '-'} / {trip.actual_distance_km ?? '-'}
                    </span>
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

