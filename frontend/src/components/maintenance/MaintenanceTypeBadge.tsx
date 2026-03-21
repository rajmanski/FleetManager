import { Car, Settings, Wrench } from 'lucide-react'

const MAINTENANCE_TYPE_STYLES: Record<
  string,
  { bg: string; text: string; Icon: typeof Wrench }
> = {
  Routine: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    Icon: Settings,
  },
  Repair: {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    Icon: Wrench,
  },
  TireChange: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    Icon: Car,
  },
}

export function MaintenanceTypeBadge({ type }: { type: string }) {
  const style = MAINTENANCE_TYPE_STYLES[type] ?? {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    Icon: Settings,
  }
  const Icon = style.Icon

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <Icon className="h-3 w-3" />
      {type}
    </span>
  )
}

