import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { AdminUser } from '@/hooks/users/useUsers'

type DeleteConfirmModalProps = {
  user: AdminUser
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteConfirmModal({
  user,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  return (
    <Modal title="Delete user">
      <p className="mt-2 text-sm text-gray-600">
        Are you sure you want to delete user <strong>{user.login}</strong>? This
        action cannot be undone.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Modal>
  )
}
