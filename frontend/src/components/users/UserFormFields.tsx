import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
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
      <Input
        label="Login"
        type="text"
        error={errors.login?.message}
        required
        autoComplete="username"
        {...register('login')}
      />
      <Input
        label={mode === 'add' ? 'Password' : 'Password (leave empty to keep)'}
        type="password"
        error={errors.password?.message}
        required={mode === 'add'}
        placeholder={mode === 'edit' ? 'Leave empty to keep current' : undefined}
        autoComplete="new-password"
        {...register('password')}
      />
      <Input
        label="Email"
        type="email"
        error={errors.email?.message}
        required
        autoComplete="email"
        {...register('email')}
      />
      <Select
        label="Role"
        error={errors.role?.message}
        required
        options={ROLE_OPTIONS_WITH_LABELS}
        {...register('role')}
      />
    </div>
  )
}
