import { CalendarClock, FileText, Route, Truck, Trash2, Wrench } from 'lucide-react'
import type { Vehicle } from '@/hooks/vehicles/useVehicles'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { EntityCellLink } from '@/components/ui/EntityCellLink'
import { TableActionsCell } from '@/components/ui/TableActionsCell'
import { ThWithIcon } from '@/components/ui/ThWithIcon'
import { useClickableRow } from '@/hooks/useClickableRow'
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
  const { getRowProps } = useClickableRow()

  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <ThWithIcon icon={FileText}>VIN</ThWithIcon>
                <ThWithIcon icon={Truck}>Brand</ThWithIcon>
                <ThWithIcon icon={Route}>Model</ThWithIcon>
                <ThWithIcon icon={CalendarClock}>Production year</ThWithIcon>
                <ThWithIcon icon={Route}>Mileage (km)</ThWithIcon>
                <ThWithIcon icon={Wrench}>Status</ThWithIcon>
                <ThWithIcon icon={Wrench}>Actions</ThWithIcon>
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
                    {...getRowProps(detailsPath, `Open vehicle details for VIN ${vehicle.vin}`)}
                    className={`${rowClassName} cursor-pointer`}
                  >
                    <td className="px-4 py-3">
                      <EntityCellLink to={detailsPath}>
                        {vehicle.vin}
                      </EntityCellLink>
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

function VehicleStatusIcon({ status }: { status: string }) {
  const meta = getVehicleStatusMeta(status)
  return <meta.Icon className={`size-4 shrink-0 ${meta.colorClass}`} aria-hidden="true" />
}
