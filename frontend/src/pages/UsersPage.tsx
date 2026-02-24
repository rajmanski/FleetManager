import { useState } from 'react'
import { AddUserModal } from '@/components/users/AddUserModal'
import { DeleteConfirmModal } from '@/components/users/DeleteConfirmModal'
import { EditUserModal } from '@/components/users/EditUserModal'
import { UsersTable } from '@/components/users/UsersTable'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { useUsers, type AdminUser } from '@/hooks/users/useUsers'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { extractApiError } from '@/utils/api'

function UsersPage() {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)

  const createCallbacks = useMutationCallbacks({
    successMessage: 'User added',
    errorFallback: 'Failed to add user',
    onSuccess: () => setAddModalOpen(false),
  })
  const updateCallbacks = useMutationCallbacks({
    successMessage: 'User updated',
    errorFallback: 'Failed to update user',
    onSuccess: () => setEditUser(null),
  })
  const deleteCallbacks = useMutationCallbacks({
    successMessage: 'User deactivated',
    errorFallback: 'Failed to deactivate user',
    onSuccess: () => setDeleteUser(null),
  })

  const {
    usersQuery,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useUsers()

  const handleDeleteConfirm = () => {
    if (deleteUser) {
      deleteMutation.mutate(deleteUser.id, deleteCallbacks)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users management"
        description="Create, edit and deactivate administrator panel users"
        action={
          <Button onClick={() => setAddModalOpen(true)}>Add user</Button>
        }
      />

      {usersQuery.isLoading && <LoadingMessage />}
      {usersQuery.isError && (
        <ErrorMessage message="Failed to load users. You may not have permission." />
      )}
      {usersQuery.isSuccess && usersQuery.data && (
        <UsersTable
          users={usersQuery.data}
          onEdit={setEditUser}
          onDelete={setDeleteUser}
        />
      )}

      {addModalOpen && (
        <AddUserModal
          onClose={() => setAddModalOpen(false)}
          onSubmit={(data) =>
            createMutation.mutate(data, createCallbacks)
          }
          isSubmitting={createMutation.isPending}
          errorMessage={extractApiError(createMutation.error)}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSubmit={(data) =>
            updateMutation.mutate({ id: editUser.id, data }, updateCallbacks)
          }
          isSubmitting={updateMutation.isPending}
          errorMessage={extractApiError(updateMutation.error)}
        />
      )}

      {deleteUser && (
        <DeleteConfirmModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={handleDeleteConfirm}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

export default UsersPage
