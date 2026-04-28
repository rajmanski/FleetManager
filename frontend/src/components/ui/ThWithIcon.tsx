import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type ThWithIconProps = {
  icon: LucideIcon
  children: ReactNode
  className?: string
}

export function ThWithIcon({ icon: Icon, children, className }: ThWithIconProps) {
  return (
    <th className={className ?? 'px-4 py-3'}>
      <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
        <Icon className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
        {children}
      </span>
    </th>
  )
}
