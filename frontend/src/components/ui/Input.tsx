import { forwardRef } from 'react'
import { FormField } from '@/components/ui/FormField'
import {
  INPUT_CLASS,
  INPUT_CLASS_COMPACT,
  INPUT_NUMERIC_CLASS,
  INPUT_NUMERIC_DECIMAL_CLASS,
} from '@/constants/inputStyles'

type InputVariant = 'default' | 'compact' | 'numeric' | 'numericDecimal'

const variantClasses: Record<InputVariant, string> = {
  default: INPUT_CLASS,
  compact: INPUT_CLASS_COMPACT,
  numeric: INPUT_NUMERIC_CLASS,
  numericDecimal: INPUT_NUMERIC_DECIMAL_CLASS,
}

type InputProps = {
  label: string
  error?: string
  required?: boolean
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local'
  variant?: InputVariant
  className?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    required,
    type = 'text',
    variant = 'default',
    className = '',
    ...rest
  },
  ref
) {
  const inputClass = variantClasses[variant]
  const combinedClass = className ? `${inputClass} ${className}` : inputClass

  return (
    <FormField label={label} error={error} required={required}>
      <input
        ref={ref}
        type={type}
        className={combinedClass}
        {...rest}
      />
    </FormField>
  )
})
