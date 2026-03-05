import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { OrderFormModal } from '@/components/orders/OrderFormModal'
import { OrdersFiltersBar } from '@/components/orders/OrdersFiltersBar'
import { OrdersTable } from '@/components/orders/OrdersTable'
import { useOrders } from '@/hooks/orders/useOrders'
import { useAuth } from '@/hooks/useAuth'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { usePagination } from '@/hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { extractApiError } from '@/utils/api'

function OrdersPage() {
  const { role } = useAuth()
  const canManageOrders = role === 'Administrator' || role === 'Spedytor'
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const { ordersQuery, createMutation } = useOrders({ page, limit, status, search })
  const createCallbacks = useMutationCallbacks({
    successMessage: 'Order created',
    errorFallback: 'Failed to create order',
    onSuccess: () => setAddModalOpen(false),
  })

  const orders = useMemo(() => ordersQuery.data?.data ?? [], [ordersQuery.data])
  const total = ordersQuery.data?.total ?? 0
  const pagination = usePagination({ page, setPage, limit, setLimit, total })

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      pagination.resetPage()
    },
    [pagination]
  )

  const createErrorMessage = extractApiError(createMutation.error)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Transport orders list with filtering"
        action={
          canManageOrders ? (
            <Button onClick={() => setAddModalOpen(true)}>Add order</Button>
          ) : undefined
        }
      />

      <OrdersFiltersBar
        search={search}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={setStatus}
        limit={limit}
        pagination={pagination}
      />

      {ordersQuery.isLoading && <LoadingMessage />}
      {ordersQuery.isError && <ErrorMessage message="Failed to load orders." />}

      {ordersQuery.isSuccess && (
        <OrdersTable
          orders={orders}
          page={page}
          total={total}
          pagination={pagination}
        />
      )}

      {createErrorMessage && !createMutation.isPending && (
        <ErrorMessage message={createErrorMessage} />
      )}

      {addModalOpen && (
        <OrderFormModal
          title="Add order"
          submitLabel={createMutation.isPending ? 'Creating...' : 'Create order'}
          onClose={() => setAddModalOpen(false)}
          onSubmit={(payload) =>
            createMutation.mutate(payload, createCallbacks)
          }
          isSubmitting={createMutation.isPending}
          errorMessage={createErrorMessage}
        />
      )}
    </div>
  )
}

export default OrdersPage
