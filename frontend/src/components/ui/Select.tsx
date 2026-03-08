import { forwardRef } from 'react'
import { FormField } from '@/components/ui/FormField'
import { INPUT_CLASS, INPUT_CLASS_COMPACT } from '@/constants/inputStyles'

export type SelectOption = {
  value: string | number
  label: string
}

type SelectProps = {
  label: string
  error?: string
  required?: boolean
  options: readonly SelectOption[] | readonly string[]
  allowEmpty?: boolean
  emptyLabel?: string
  variant?: 'default' | 'compact'
  className?: string
} & Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'className' | 'children'
>

const inputClasses = {
  default: INPUT_CLASS,
  compact: INPUT_CLASS_COMPACT,
}

function normalizeOptions(
  options: readonly SelectOption[] | readonly string[]
): SelectOption[] {
  if (options.length === 0) return []
  const first = options[0]
  if (typeof first === 'string') {
    return (options as readonly string[]).map((v) => ({ value: v, label: v }))
  }
  return options as SelectOption[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    error,
    required,
    options,
    allowEmpty = false,
    emptyLabel = '—',
    variant = 'default',
    className = '',
    ...rest
  },
  ref
) {
  const normalized = normalizeOptions(options)
  const inputClass = inputClasses[variant]
  const combinedClass = className ? `${inputClass} ${className}` : inputClass

  return (
    <FormField label={label} error={error} required={required}>
      <select ref={ref} className={combinedClass} {...rest}>
        {allowEmpty && (
          <option value="">{emptyLabel}</option>
        )}
        {normalized.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  )
})
