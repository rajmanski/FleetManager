type FormFieldProps = {
  label: string
  error?: string
  children: React.ReactNode
  required?: boolean
  className?: string
}

export function FormField({ label, error, children, required, className }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
