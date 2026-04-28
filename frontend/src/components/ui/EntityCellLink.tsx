import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

const defaultClasses =
  'text-slate-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2'

type EntityCellLinkProps = {
  to: string
  children: ReactNode
  className?: string
  ariaLabel?: string
}

function stopPropagation(event: React.MouseEvent | React.KeyboardEvent) {
  event.stopPropagation()
}

export function EntityCellLink({ to, children, className, ariaLabel }: EntityCellLinkProps) {
  return (
    <Link
      to={to}
      className={className ?? defaultClasses}
      onClick={stopPropagation}
      onKeyDown={stopPropagation}
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
    >
      {children}
    </Link>
  )
}
