import type { LucideIcon } from 'lucide-react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import type { ReactNode } from 'react'

export type SortDirection = 'asc' | 'desc'

export type SortConfig = {
  column: string
  direction: SortDirection
} | null

type SortableThProps = {
  column: string
  sortConfig: SortConfig
  onSort: (column: string) => void
  icon: LucideIcon
  children: ReactNode
  className?: string
}

export function SortableTh({
  column,
  sortConfig,
  onSort,
  icon: Icon,
  children,
  className,
}: SortableThProps) {
  const isActive = sortConfig?.column === column

  return (
    <th
      className={`${className ?? 'px-4 py-3'} cursor-pointer select-none hover:bg-gray-100 transition-colors`}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
        <Icon className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
        {children}
        {isActive && (
          sortConfig.direction === 'asc' ? (
            <ArrowUp className="size-4 shrink-0 text-slate-700" aria-hidden="true" />
          ) : (
            <ArrowDown className="size-4 shrink-0 text-slate-700" aria-hidden="true" />
          )
        )}
      </span>
    </th>
  )
}
