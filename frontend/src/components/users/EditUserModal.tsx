import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import type { AdminUser } from '@/hooks/users/useUsers'
import type { UpdateUserFormValues } from '@/schemas/users'
import { updateUserSchema } from '@/schemas/users'
import { UserFormFields } from './UserFormFields'

type EditUserModalProps = {
  user: AdminUser
  onClose: () => void
  onSubmit: (data: UpdateUserFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}

export function EditUserModal({
  user,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: EditUserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      login: user.login,
      email: user.email,
      role: user.role as 'Administrator' | 'Spedytor' | 'Mechanik',
      password: '',
    },
  })

  return (
    <Modal title="Edit user" error={errorMessage}>
      <form
        className="mt-4 space-y-4"
        onSubmit={handleSubmit((data) => onSubmit(data))}
      >
        <UserFormFields register={register} errors={errors} mode="edit" />
        <ModalFooter
          onCancel={onClose}
          submitLabel={isSubmitting ? 'Saving...' : 'Save'}
          isSubmitting={isSubmitting}
        />
      </form>
    </Modal>
  )
}
