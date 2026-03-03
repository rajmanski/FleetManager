import { useCallback, useMemo, useState } from 'react'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { ClientsFiltersBar } from '@/components/clients/ClientsFiltersBar'
import { ClientsTable } from '@/components/clients/ClientsTable'
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
  const [editClient, setEditClient] = useState<Client | null>(null)

  const restoreCallbacks = useMutationCallbacks({
    successMessage: 'Client restored',
    errorFallback: 'Failed to restore client',
  })

  const { clientsQuery, restoreMutation, isAdmin } = useClients({
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Clients list with soft-deleted records handling"
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

      {editClient && (
        <ErrorMessage message="Editing clients is not implemented yet." />
      )}
    </div>
  )
}

export default ClientsPage

