import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import type { Vehicle } from '@/hooks/vehicles/useVehicles'

type PaginationHelpers = {
  totalPages: number
  canGoPrev: boolean
  canGoNext: boolean
  goPrev: () => void
  goNext: () => void
}

type VehiclesTableProps = {
  vehicles: Vehicle[]
  page: number
  total: number
  pagination: PaginationHelpers
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
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Showing page {page} of {pagination.totalPages} ({total} results)
      </div>
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
                      <div className="flex items-center gap-2">
                        {isAdmin && isDeleted && (
                          <Button
                            variant="secondary"
                            onClick={() => onRestore(vehicle.id)}
                            disabled={isRestoring}
                            className="px-3 py-1.5 text-xs"
                          >
                            {isRestoring ? 'Restoring...' : 'Restore'}
                          </Button>
                        )}
                        {!isDeleted && canManageVehicles && (
                          <Button
                            variant="secondary"
                            onClick={() => onEdit(vehicle)}
                            className="px-3 py-1.5 text-xs"
                          >
                            Edit
                          </Button>
                        )}
                        {!isDeleted && !canManageVehicles && !isAdmin && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          onClick={pagination.goPrev}
          disabled={!pagination.canGoPrev}
          className="px-3 py-1.5 text-sm"
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          onClick={pagination.goNext}
          disabled={!pagination.canGoNext}
          className="px-3 py-1.5 text-sm"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
