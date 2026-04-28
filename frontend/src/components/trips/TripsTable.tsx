import { Hash, FileText, Building2, Truck, User, CircleDot, Calendar, Route, ChevronRight } from 'lucide-react'
import type { Trip } from '@/hooks/trips/useTrips'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { EntityCellLink } from '@/components/ui/EntityCellLink'
import { ThWithIcon } from '@/components/ui/ThWithIcon'
import { useClickableRow } from '@/hooks/useClickableRow'
import { formatDateTime } from '@/utils/date'
import { TripStatusBadge } from '@/components/trips/TripStatusBadge'

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
  const { getRowProps } = useClickableRow()

  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <ThWithIcon icon={Hash}>Trip ID</ThWithIcon>
                <ThWithIcon icon={FileText}>Order</ThWithIcon>
                <ThWithIcon icon={Building2}>Client</ThWithIcon>
                <ThWithIcon icon={Truck}>Vehicle (VIN)</ThWithIcon>
                <ThWithIcon icon={User}>Driver</ThWithIcon>
                <ThWithIcon icon={CircleDot}>Status</ThWithIcon>
                <ThWithIcon icon={Calendar}>Start time</ThWithIcon>
                <ThWithIcon icon={Calendar}>End time</ThWithIcon>
                <ThWithIcon icon={Route}>Distance</ThWithIcon>
                <th className="w-10 px-2" aria-hidden />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {trips.map((trip) => (
                <tr
                  key={trip.id}
                  {...getRowProps(`/trips/${trip.id}`, `Open trip ${trip.id} details`)}
                  className="cursor-pointer transition-colors hover:bg-gray-50 focus-within:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-700">
                    <EntityCellLink to={`/trips/${trip.id}`}>
                      {trip.id}
                    </EntityCellLink>
                  </td>
                  <td className="px-4 py-3">
                    <EntityCellLink to={`/orders/${trip.order_id}`}>
                      {trip.order_number}
                    </EntityCellLink>
                  </td>
                  <td className="px-4 py-3">{trip.client_company ?? '-'}</td>
                  <td className="px-4 py-3">
                    <EntityCellLink to={`/vehicles/${trip.vehicle_id}`}>
                      {trip.vehicle_vin}
                    </EntityCellLink>
                  </td>
                  <td className="px-4 py-3">
                    <EntityCellLink to={`/drivers/${trip.driver_id}`}>
                      {trip.driver_name}
                    </EntityCellLink>
                  </td>
                  <td className="px-4 py-3">
                    <TripStatusBadge status={trip.status} />
                  </td>
                  <td className="px-4 py-3">{formatDateTime(trip.start_time)}</td>
                  <td className="px-4 py-3">{formatDateTime(trip.end_time)}</td>
                  <td className="px-4 py-3">
                    <span className="whitespace-nowrap">
                      {trip.planned_distance_km ?? '-'} / {trip.actual_distance_km ?? '-'}
                    </span>
                  </td>
                  <td className="w-10 px-2 py-3">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
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
