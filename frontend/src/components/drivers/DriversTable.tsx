import { Trash2, UserCheck, CalendarOff, Truck } from 'lucide-react'
import type { Driver } from '@/hooks/drivers/useDrivers'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { CertificateStatusTooltip } from '@/components/drivers/CertificateStatusTooltip'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { TableActionsCell } from '@/components/ui/TableActionsCell'

const DRIVER_STATUS_CONFIG: Record<
  string,
  { label: string; Icon: typeof UserCheck; color: string }
> = {
  Available: { label: 'Available', Icon: UserCheck, color: 'text-green-600' },
  OnLeave: { label: 'On Leave', Icon: CalendarOff, color: 'text-amber-600' },
  InRoute: { label: 'In Route', Icon: Truck, color: 'text-blue-600' },
}

function DriverStatusCell({ status, isDeleted }: { status: string; isDeleted: boolean }) {
  if (isDeleted) return <span className="text-gray-400">-</span>
  const config = DRIVER_STATUS_CONFIG[status] ?? { label: status, Icon: UserCheck, color: 'text-gray-600' }
  const { label, Icon, color } = config
  return (
    <span className={`inline-flex items-center gap-2 ${color}`}>
      <Icon className="size-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  )
}

type DriversTableProps = {
  drivers: Driver[]
  page: number
  total: number
  pagination: Pick<PaginationHelpers, 'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'>
  canManageDrivers: boolean
  isAdmin: boolean
  onEdit: (driver: Driver) => void
  onRestore: (driverId: number) => void
  isRestoring: boolean
}

export function DriversTable({
  drivers,
  page,
  total,
  pagination,
  canManageDrivers,
  isAdmin,
  onEdit,
  onRestore,
  isRestoring,
}: DriversTableProps) {
  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 font-medium text-gray-700">PESEL</th>
                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 font-medium text-gray-700">Certificate status</th>
                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {drivers.map((driver) => {
                const isDeleted = Boolean(driver.deleted_at)
                return (
                  <tr key={driver.id} className={isDeleted ? 'bg-gray-100 text-gray-500' : ''}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700">
                        {driver.first_name} {driver.last_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">{driver.pesel}</td>
                    <td className="px-4 py-3">
                      {isDeleted ? (
                        <span className="inline-flex items-center gap-2 text-gray-500">
                          <Trash2 className="size-4 shrink-0" />
                          <span>{DRIVER_STATUS_CONFIG[driver.status]?.label ?? driver.status}</span>
                        </span>
                      ) : (
                        <DriverStatusCell status={driver.status} isDeleted={false} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <CertificateStatusTooltip driver={driver} isDeleted={isDeleted} />
                    </td>
                    <td className="px-4 py-3">
                      <TableActionsCell
                        isDeleted={isDeleted}
                        isAdmin={isAdmin}
                        canManage={canManageDrivers}
                        onRestore={() => onRestore(driver.id)}
                        onEdit={() => onEdit(driver)}
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
