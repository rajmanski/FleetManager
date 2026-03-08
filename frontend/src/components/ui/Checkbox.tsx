import { forwardRef } from 'react'
import { FormField } from '@/components/ui/FormField'

type CheckboxProps = {
  label: string
  error?: string
  description?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  onBlur?: () => void
  disabled?: boolean
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'checked' | 'onChange'
>

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      label,
      error,
      description,
      checked,
      onChange,
      onBlur,
      disabled,
      ...rest
    },
    ref
  ) {
    return (
      <FormField label={label} error={error}>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            ref={ref}
            type="checkbox"
            checked={checked ?? false}
            onChange={(e) => onChange?.(e.target.checked)}
            onBlur={onBlur}
            disabled={disabled}
            className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
            {...rest}
          />
          <span className="text-sm text-gray-700">{description ?? label}</span>
        </label>
      </FormField>
    )
  }
)
