type ErrorMessageProps = {
  message: string | null
  variant?: 'default' | 'soft'
  className?: string
}

const variantClasses = {
  default: 'rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700',
  soft: 'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700',
}

export function ErrorMessage({ message, variant = 'default', className = '' }: ErrorMessageProps) {
  if (!message) return null
  return <p className={`${variantClasses[variant]} ${className}`.trim()}>{message}</p>
}
