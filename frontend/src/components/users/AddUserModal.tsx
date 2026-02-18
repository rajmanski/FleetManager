import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormField } from '@/components/ui/FormField'
import { FormErrorMessage } from '@/components/ui/FormErrorMessage'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { INPUT_CLASS } from '@/constants/inputStyles'
import type { CreateUserFormValues } from '@/schemas/users'
import { createUserSchema, ROLE_OPTIONS_WITH_LABELS } from '@/schemas/users'

type AddUserModalProps = {
  onClose: () => void
  onSubmit: (data: CreateUserFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}

export function AddUserModal({
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: AddUserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { login: '', password: '', email: '', role: 'Spedytor' },
  })

  return (
    <Modal title="Add user">
      <form
        className="mt-4 space-y-4"
        onSubmit={handleSubmit((data) => onSubmit(data))}
      >
        <FormField label="Login" error={errors.login?.message}>
          <input
            type="text"
            {...register('login')}
            className={INPUT_CLASS}
            autoComplete="username"
          />
        </FormField>
        <FormField label="Password" error={errors.password?.message}>
          <input
            type="password"
            {...register('password')}
            className={INPUT_CLASS}
            autoComplete="new-password"
          />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <input
            type="email"
            {...register('email')}
            className={INPUT_CLASS}
            autoComplete="email"
          />
        </FormField>
        <FormField label="Role" error={errors.role?.message}>
          <select {...register('role')} className={INPUT_CLASS}>
            {ROLE_OPTIONS_WITH_LABELS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormErrorMessage message={errorMessage} />
        <ModalFooter
          onCancel={onClose}
          submitLabel={isSubmitting ? 'Adding...' : 'Add'}
          isSubmitting={isSubmitting}
        />
      </form>
    </Modal>
  )
}
