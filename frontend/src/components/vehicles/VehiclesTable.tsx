import { CalendarClock, FileText, Route, Truck, Trash2, Wrench } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { Vehicle } from '@/hooks/vehicles/useVehicles'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { TableActionsCell } from '@/components/ui/TableActionsCell'
import { formatVehicleStatusLabel, getVehicleStatusMeta } from '@/utils/vehicleStatus'

type VehiclesTableProps = {
  vehicles: Vehicle[]
  page: number
  total: number
  pagination: Pick<PaginationHelpers, 'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'>
  canManageVehicles: boolean
  isAdmin: boolean
  onEdit: (vehicle: Vehicle) => void
  onRestore: (vehicleId: number) => void
  isRestoring: boolean
}

export function VehiclesTable({
  vehicles,
  page,
  total,
  pagination,
  canManageVehicles,
  isAdmin,
  onEdit,
  onRestore,
  isRestoring,
}: VehiclesTableProps) {
  const navigate = useNavigate()

  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="size-4 text-slate-600" aria-hidden="true" />
                    VIN
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="size-4 text-slate-600" aria-hidden="true" />
                    Brand
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Route className="size-4 text-slate-600" aria-hidden="true" />
                    Model
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4 text-slate-600" aria-hidden="true" />
                    Production year
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Route className="size-4 text-slate-600" aria-hidden="true" />
                    Mileage (km)
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Wrench className="size-4 text-slate-600" aria-hidden="true" />
                    Status
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Wrench className="size-4 text-slate-600" aria-hidden="true" />
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {vehicles.map((vehicle) => {
                const isDeleted = Boolean(vehicle.deleted_at)
                const detailsPath = `/vehicles/${vehicle.id}`
                const rowClassName = isDeleted
                  ? 'bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 focus-within:bg-gray-200'
                  : 'bg-white transition-colors hover:bg-gray-50 focus-within:bg-gray-50'
                return (
                  <tr
                    key={vehicle.id}
                    className={`${rowClassName} cursor-pointer`}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open vehicle details for VIN ${vehicle.vin}`}
                    onClick={() => navigate(detailsPath)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(detailsPath)
                      }
                    }}
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={detailsPath}
                        className="text-slate-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        {vehicle.vin}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{vehicle.brand ?? '-'}</td>
                    <td className="px-4 py-3">{vehicle.model ?? '-'}</td>
                    <td className="px-4 py-3">{vehicle.production_year ?? '-'}</td>
                    <td className="px-4 py-3">{vehicle.current_mileage_km ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        {isDeleted ? (
                          <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />
                        ) : (
                          <VehicleStatusIcon status={vehicle.status} />
                        )}
                        <span>{formatVehicleStatusLabel(vehicle.status)}</span>
                      </span>
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <TableActionsCell
                        isDeleted={isDeleted}
                        isAdmin={isAdmin}
                        canManage={canManageVehicles}
                        onRestore={() => onRestore(vehicle.id)}
                        onEdit={() => onEdit(vehicle)}
                        isRestoring={isRestoring}
                      />
                    </td>
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

function VehicleStatusIcon({ status }: { status: string }) {
  const meta = getVehicleStatusMeta(status)
  return <meta.Icon className={`size-4 shrink-0 ${meta.colorClass}`} aria-hidden="true" />
}
