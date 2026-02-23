import { Trash2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Driver } from '@/hooks/drivers/useDrivers'
import {
  getCertificateStatus,
  getCertificateTooltip,
  type CertificateStatus,
} from '@/utils/driver'

type PaginationHelpers = {
  totalPages: number
  canGoPrev: boolean
  canGoNext: boolean
  goPrev: () => void
  goNext: () => void
}

function CertificateStatusCell({
  driver,
  isDeleted,
}: {
  driver: Driver
  isDeleted: boolean
}) {
  if (isDeleted) return <span className="text-gray-400">-</span>

  const status = getCertificateStatus(driver)
  const tooltip = getCertificateTooltip(driver)

  const config: Record<
    CertificateStatus,
    { Icon: typeof CheckCircle2; color: string; label: string }
  > = {
    valid: { Icon: CheckCircle2, color: 'text-green-600', label: 'Wszystkie certyfikaty ważne' },
    expiring: {
      Icon: AlertTriangle,
      color: 'text-amber-500',
      label: 'Certyfikat wygasa w ciągu 30 dni',
    },
    expired: { Icon: XCircle, color: 'text-red-600', label: 'Certyfikat wygasły' },
  }

  const { Icon, color, label } = config[status]

  return (
    <span
      className={`inline-flex items-center gap-1 ${color}`}
      title={tooltip}
    >
      <Icon className="size-4" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

type DriversTableProps = {
  drivers: Driver[]
  page: number
  total: number
  pagination: PaginationHelpers
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
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Showing page {page} of {pagination.totalPages} ({total} results)
      </div>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 font-medium text-gray-700">PESEL</th>
                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 font-medium text-gray-700">Status uprawnień</th>
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
                      <span className="inline-flex items-center gap-1">
                        {isDeleted && <Trash2 className="size-3.5" />}
                        <span>{driver.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <CertificateStatusCell driver={driver} isDeleted={isDeleted} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isAdmin && isDeleted && (
                          <Button
                            variant="secondary"
                            onClick={() => onRestore(driver.id)}
                            disabled={isRestoring}
                            className="px-3 py-1.5 text-xs"
                          >
                            {isRestoring ? 'Restoring...' : 'Restore'}
                          </Button>
                        )}
                        {!isDeleted && canManageDrivers && (
                          <Button
                            variant="secondary"
                            onClick={() => onEdit(driver)}
                            className="px-3 py-1.5 text-xs"
                          >
                            Edit
                          </Button>
                        )}
                        {!isDeleted && !canManageDrivers && !isAdmin && (
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
