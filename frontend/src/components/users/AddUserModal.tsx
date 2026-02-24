import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import type { CreateUserFormValues } from '@/schemas/users'
import { createUserSchema } from '@/schemas/users'
import { UserFormFields } from './UserFormFields'

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
    <Modal title="Add user" error={errorMessage}>
      <form
        className="mt-4 space-y-4"
        onSubmit={handleSubmit((data) => onSubmit(data))}
      >
        <UserFormFields register={register} errors={errors} mode="add" />
        <ModalFooter
          onCancel={onClose}
          submitLabel={isSubmitting ? 'Adding...' : 'Add'}
          isSubmitting={isSubmitting}
        />
      </form>
    </Modal>
  )
}
