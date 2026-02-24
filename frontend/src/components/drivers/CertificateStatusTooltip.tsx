import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import type { Driver } from '@/hooks/drivers/useDrivers'
import {
  getCertificateStatus,
  getCertificateTooltip,
  type CertificateStatus,
} from '@/utils/driver'

type CertificateStatusTooltipProps = {
  driver: Driver
  isDeleted?: boolean
}

const statusConfig: Record<
  CertificateStatus,
  { Icon: typeof CheckCircle2; color: string; label: string }
> = {
  valid: { Icon: CheckCircle2, color: 'text-green-600', label: 'Valid' },
  expiring: {
    Icon: AlertTriangle,
    color: 'text-amber-500',
    label: 'Expiring',
  },
  expired: { Icon: XCircle, color: 'text-red-600', label: 'Expired' },
}

export function CertificateStatusTooltip({
  driver,
  isDeleted = false,
}: CertificateStatusTooltipProps) {
  if (isDeleted) {
    return <span className="text-gray-400">-</span>
  }

  const status = getCertificateStatus(driver)
  const tooltipContent = getCertificateTooltip(driver)
  const { Icon, color, label } = statusConfig[status]

  return (
    <Tooltip content={tooltipContent} position="top">
      <span className={`inline-flex items-center gap-2 ${color}`}>
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="text-sm font-medium">{label}</span>
      </span>
    </Tooltip>
  )
}
