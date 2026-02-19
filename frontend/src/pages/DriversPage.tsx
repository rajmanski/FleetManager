import { useCallback, useMemo, useState } from 'react'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { DriversFiltersBar } from '@/components/drivers/DriversFiltersBar'
import { DriversTable } from '@/components/drivers/DriversTable'
import { useDrivers } from '@/hooks/drivers/useDrivers'
import { useAuth } from '@/hooks/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

function DriversPage() {
  const { isAdmin } = useAuth()
  const [showDeleted, setShowDeleted] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)

  const {
    driversQuery,
    restoreMutation,
    isAdmin: isAdminFromHook,
  } = useDrivers({ page, limit, statusFilter, search, showDeleted })

  const drivers = useMemo(() => driversQuery.data?.data ?? [], [driversQuery.data])
  const total = driversQuery.data?.total ?? 0
  const pagination = usePagination({ page, setPage, limit, setLimit, total })

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setStatusFilter(value)
      pagination.resetPage()
    },
    [pagination]
  )

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
        title="Drivers"
        description="Drivers list with archived records handling"
      />

      <DriversFiltersBar
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        search={search}
        onSearchChange={handleSearchChange}
        limit={limit}
        showDeleted={showDeleted}
        onShowDeletedChange={setShowDeleted}
        pagination={pagination}
        isAdmin={isAdminFromHook ?? isAdmin}
      />

      {driversQuery.isLoading && <LoadingMessage />}
      {driversQuery.isError && (
        <ErrorMessage message="Failed to load drivers." />
      )}

      {driversQuery.isSuccess && (
        <DriversTable
          drivers={drivers}
          page={page}
          total={total}
          pagination={pagination}
          isAdmin={isAdminFromHook ?? isAdmin}
          onRestore={(id) => restoreMutation.mutate(id)}
          isRestoring={restoreMutation.isPending}
        />
      )}
    </div>
  )
}

export default DriversPage
