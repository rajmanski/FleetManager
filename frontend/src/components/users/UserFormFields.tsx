import { FormField } from '@/components/ui/FormField'
import { INPUT_CLASS } from '@/constants/inputStyles'
import { ROLE_OPTIONS_WITH_LABELS } from '@/schemas/users'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { CreateUserFormValues, UpdateUserFormValues } from '@/schemas/users'

type UserFormFieldsProps = {
  register:
    | UseFormRegister<CreateUserFormValues>
    | UseFormRegister<UpdateUserFormValues>
  errors: FieldErrors<CreateUserFormValues> | FieldErrors<UpdateUserFormValues>
  mode: 'add' | 'edit'
}

export function UserFormFields({ register, errors, mode }: UserFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField label="Login" error={errors.login?.message} required>
        <input
          type="text"
          {...register('login')}
          className={INPUT_CLASS}
          autoComplete="username"
        />
      </FormField>
      <FormField
        label={mode === 'add' ? 'Password' : 'Password (leave empty to keep)'}
        error={errors.password?.message}
        required={mode === 'add'}
      >
        <input
          type="password"
          {...register('password')}
          className={INPUT_CLASS}
          placeholder={mode === 'edit' ? 'Leave empty to keep current' : undefined}
          autoComplete="new-password"
        />
      </FormField>
      <FormField label="Email" error={errors.email?.message} required>
        <input
          type="email"
          {...register('email')}
          className={INPUT_CLASS}
          autoComplete="email"
        />
      </FormField>
      <FormField label="Role" error={errors.role?.message} required>
        <select {...register('role')} className={INPUT_CLASS}>
          {ROLE_OPTIONS_WITH_LABELS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  )
}
