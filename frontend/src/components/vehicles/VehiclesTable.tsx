import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Vehicle } from '@/hooks/vehicles/useVehicles'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { TableActionsCell } from '@/components/ui/TableActionsCell'

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
  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">VIN</th>
                <th className="px-4 py-3 font-medium text-gray-700">Brand</th>
                <th className="px-4 py-3 font-medium text-gray-700">Model</th>
                <th className="px-4 py-3 font-medium text-gray-700">Production year</th>
                <th className="px-4 py-3 font-medium text-gray-700">Mileage (km)</th>
                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {vehicles.map((vehicle) => {
                const isDeleted = Boolean(vehicle.deleted_at)
                return (
                  <tr key={vehicle.id} className={isDeleted ? 'bg-gray-100 text-gray-500' : ''}>
                    <td className="px-4 py-3">
                      <Link
                        to={`/vehicles/${vehicle.id}`}
                        className="text-slate-700 underline-offset-2 hover:underline"
                      >
                        {vehicle.vin}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{vehicle.brand ?? '-'}</td>
                    <td className="px-4 py-3">{vehicle.model ?? '-'}</td>
                    <td className="px-4 py-3">{vehicle.production_year ?? '-'}</td>
                    <td className="px-4 py-3">{vehicle.current_mileage_km ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        {isDeleted && <Trash2 className="size-3.5" />}
                        <span>{vehicle.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
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
