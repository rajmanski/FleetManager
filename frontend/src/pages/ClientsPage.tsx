import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { ClientsFiltersBar } from '@/components/clients/ClientsFiltersBar'
import { ClientsTable } from '@/components/clients/ClientsTable'
import { ClientFormModal, type ClientFormValues } from '@/components/clients/ClientFormModal'
import { useClients, type Client } from '@/hooks/clients/useClients'
import { useAuth } from '@/hooks/useAuth'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { usePagination } from '@/hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { extractApiError } from '@/utils/api'

function ClientsPage() {
  const { role } = useAuth()
  const canManageClients = role === 'Administrator' || role === 'Spedytor'

  const [showDeleted, setShowDeleted] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)

  const restoreCallbacks = useMutationCallbacks({
    successMessage: 'Client restored',
    errorFallback: 'Failed to restore client',
  })
  const createCallbacks = useMutationCallbacks({
    successMessage: 'Client added',
    errorFallback: 'Failed to add client',
    onSuccess: () => setAddModalOpen(false),
  })
  const updateCallbacks = useMutationCallbacks({
    successMessage: 'Client updated',
    errorFallback: 'Failed to update client',
    onSuccess: () => setEditClient(null),
  })

  const { clientsQuery, restoreMutation, createMutation, updateMutation, isAdmin } = useClients({
    page,
    limit,
    search,
    showDeleted,
  })

  const clients = useMemo(() => clientsQuery.data?.data ?? [], [clientsQuery.data])
  const total = clientsQuery.data?.total ?? 0
  const pagination = usePagination({ page, setPage, limit, setLimit, total })

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      pagination.resetPage()
    },
    [pagination]
  )

  const restoreErrorMessage = extractApiError(restoreMutation.error)
  const createErrorMessage = extractApiError(createMutation.error)
  const updateErrorMessage = extractApiError(updateMutation.error)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Clients list with soft-deleted records handling"
        action={
          canManageClients ? (
            <Button onClick={() => setAddModalOpen(true)}>Add client</Button>
          ) : undefined
        }
      />

      <ClientsFiltersBar
        search={search}
        onSearchChange={handleSearchChange}
        limit={limit}
        showDeleted={showDeleted}
        onShowDeletedChange={setShowDeleted}
        pagination={pagination}
        isAdmin={isAdmin}
      />

      {clientsQuery.isLoading && <LoadingMessage />}
      {clientsQuery.isError && <ErrorMessage message="Failed to load clients." />}

      {clientsQuery.isSuccess && (
        <ClientsTable
          clients={clients}
          page={page}
          total={total}
          pagination={pagination}
          canManageClients={canManageClients}
          isAdmin={isAdmin}
          onEdit={setEditClient}
          onRestore={(id) => restoreMutation.mutate(id, restoreCallbacks)}
          isRestoring={restoreMutation.isPending}
        />
      )}

      {restoreErrorMessage && !restoreMutation.isPending && (
        <ErrorMessage message={restoreErrorMessage} />
      )}

      {addModalOpen && (
        <ClientFormModal
          title="Add client"
          submitLabel={createMutation.isPending ? 'Adding...' : 'Add'}
          onClose={() => setAddModalOpen(false)}
          onSubmit={(values: ClientFormValues) =>
            createMutation.mutate(
              {
                companyName: values.companyName,
                nip: values.nip,
                address: values.address === '' ? undefined : values.address,
                contactEmail: values.contactEmail === '' ? undefined : values.contactEmail,
              },
              createCallbacks
            )
          }
          isSubmitting={createMutation.isPending}
          errorMessage={createErrorMessage}
        />
      )}

      {editClient && (
        <ClientFormModal
          title="Edit client"
          submitLabel={updateMutation.isPending ? 'Saving...' : 'Save'}
          initialData={{
            companyName: editClient.companyName,
            nip: editClient.nip,
            address: editClient.address ?? '',
            contactEmail: editClient.contactEmail ?? '',
          }}
          onClose={() => setEditClient(null)}
          onSubmit={(values: ClientFormValues) =>
            updateMutation.mutate(
              {
                id: editClient.id,
                payload: {
                  companyName: values.companyName,
                  nip: values.nip,
                  address: values.address === '' ? undefined : values.address,
                  contactEmail: values.contactEmail === '' ? undefined : values.contactEmail,
                },
              },
              updateCallbacks
            )
          }
          isSubmitting={updateMutation.isPending}
          errorMessage={updateErrorMessage}
        />
      )}
    </div>
  )
}

export default ClientsPage

