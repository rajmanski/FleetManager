import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'danger-outline'
  | 'ghost'
  | 'danger-ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

function getVariantClasses(v: ButtonVariant): string {
  switch (v) {
    case 'primary':
      return 'rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60'
    case 'secondary':
      return 'rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60'
    case 'danger':
      return 'rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60'
    case 'danger-outline':
      return 'rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60'
    case 'ghost':
      return 'text-slate-700 transition-colors hover:text-slate-900 disabled:opacity-60'
    case 'danger-ghost':
      return 'text-red-600 transition-colors hover:text-red-800 disabled:opacity-60'
  }
}

export function Button({
  variant = 'primary',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(getVariantClasses(variant), className)}
      {...rest}
    >
      {children}
    </button>
  )
}
