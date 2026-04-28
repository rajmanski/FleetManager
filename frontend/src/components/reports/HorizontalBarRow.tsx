import type { LucideIcon } from 'lucide-react'
import { formatPrice } from '@/utils/price'

type HorizontalBarRowProps = {
  label: string
  value: number
  max: number
  icon?: LucideIcon
}

export function HorizontalBarRow({ label, value, max, icon: Icon }: HorizontalBarRowProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="flex w-36 shrink-0 items-center gap-1.5 text-gray-600">
        {Icon && <Icon className="size-4 shrink-0 text-gray-400" aria-hidden="true" />}
        {label}
      </span>
      <div className="min-w-0 flex-1">
        <div className="h-2.5 overflow-hidden rounded bg-gray-100">
          <div
            className="h-full min-w-0 rounded bg-slate-600 transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="w-28 shrink-0 text-right tabular-nums text-gray-900">
        {formatPrice(value)}
      </span>
    </div>
  )
}
