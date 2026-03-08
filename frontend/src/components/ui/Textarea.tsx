import { forwardRef } from 'react'
import { FormField } from '@/components/ui/FormField'
import { INPUT_CLASS } from '@/constants/inputStyles'

type TextareaProps = {
  label: string
  error?: string
  required?: boolean
  rows?: number
  className?: string
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, required, rows = 3, className = '', ...rest },
    ref
  ) {
    const combinedClass = className ? `${INPUT_CLASS} ${className}` : INPUT_CLASS

    return (
      <FormField label={label} error={error} required={required}>
        <textarea
          ref={ref}
          rows={rows}
          className={combinedClass}
          {...rest}
        />
      </FormField>
    )
  }
)
