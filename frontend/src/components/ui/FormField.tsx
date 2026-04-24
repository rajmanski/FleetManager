import { cn } from '@/lib/utils'

type FormFieldProps = {
  label: string
  error?: string
  children: React.ReactNode
  required?: boolean
  className?: string
}

export function FormField({ label, error, children, required, className }: FormFieldProps) {
  return (
    <div className={cn('w-full min-w-0', className)}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500" aria-hidden="true"> *</span>}
      </label>
      {children}
      <div className="mt-1 min-h-[1.25rem] w-full min-w-0 max-w-full">
        {error ? (
          <p className="break-words text-sm text-red-600">{error}</p>
        ) : null}
      </div>
    </div>
  )
}
