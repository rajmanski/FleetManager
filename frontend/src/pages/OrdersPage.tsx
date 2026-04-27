import { useCallback, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { OrdersFiltersBar } from '@/components/orders/OrdersFiltersBar'
import { OrdersTable } from '@/components/orders/OrdersTable'
import { useOrders } from '@/hooks/orders/useOrders'
import { useAuth } from '@/hooks/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

function OrdersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { role } = useAuth()
  const canManageOrders = role === 'Administrator' || role === 'Spedytor'
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const { ordersQuery } = useOrders({ page, limit, status, search })

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Transport orders list with filtering. Use the integrated planning flow as the default path for creating new orders."
        action={
          canManageOrders ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => navigate('/orders/new/planning')}
                className="inline-flex items-center whitespace-nowrap"
              >
                <Plus className="mr-2 h-4 w-4 shrink-0" />
                New order (integrated flow)
              </Button>
            </div>
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

    </div>
  )
}

export default OrdersPage
