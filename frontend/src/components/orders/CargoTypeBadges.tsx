import { Package, Snowflake, AlertTriangle } from 'lucide-react'
import type { CargoType } from '@/schemas/cargo'

const CARGO_STYLES: Record<
  CargoType,
  { bg: string; text: string; Icon: typeof Package }
> = {
  General: { bg: 'bg-slate-100', text: 'text-slate-800', Icon: Package },
  Refrigerated: { bg: 'bg-cyan-100', text: 'text-cyan-800', Icon: Snowflake },
  Hazardous: { bg: 'bg-amber-100', text: 'text-amber-800', Icon: AlertTriangle },
}

type CargoTypeBadgesProps = {
  /** Comma-separated cargo types from API, e.g. "General,Hazardous" */
  cargoTypesStr: string | undefined
}

export function CargoTypeBadges({ cargoTypesStr }: CargoTypeBadgesProps) {
  if (!cargoTypesStr?.trim()) return <span className="text-gray-400">—</span>

  const types = cargoTypesStr
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  if (types.length === 0) return <span className="text-gray-400">—</span>

  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {types.map((type) => {
        const style = CARGO_STYLES[type as CargoType] ?? CARGO_STYLES.General
        const Icon = style.Icon
        return (
          <span
            key={type}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
          >
            <Icon className="h-3 w-3" />
            {type}
          </span>
        )
      })}
    </span>
  )
}
