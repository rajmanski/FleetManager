import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { DriverFormModal } from '@/components/drivers/DriverFormModal'
import { DriversFiltersBar } from '@/components/drivers/DriversFiltersBar'
import { DriversTable } from '@/components/drivers/DriversTable'
import { useDrivers, type Driver } from '@/hooks/drivers/useDrivers'
import { useAuth } from '@/hooks/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { driverToFormInitialData, hasValidCertificates } from '@/utils/driver'
import { extractApiError } from '@/utils/api'

function DriversPage() {
  const { isAdmin, canManageDrivers } = useAuth()
  const [showDeleted, setShowDeleted] = useState(false)
  const [validCertificatesOnly, setValidCertificatesOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editDriver, setEditDriver] = useState<Driver | null>(null)

  const {
    driversQuery,
    restoreMutation,
    createMutation,
    updateMutation,
    isAdmin: isAdminFromHook,
  } = useDrivers({ page, limit, statusFilter, search, showDeleted })

  const allDrivers = useMemo(() => driversQuery.data?.data ?? [], [driversQuery.data])
  const drivers = useMemo(
    () =>
      validCertificatesOnly ? allDrivers.filter(hasValidCertificates) : allDrivers,
    [allDrivers, validCertificatesOnly]
  )
  const total = validCertificatesOnly ? drivers.length : (driversQuery.data?.total ?? 0)
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
        action={
          canManageDrivers ? (
            <Button onClick={() => setAddModalOpen(true)}>Add driver</Button>
          ) : undefined
        }
      />

      <DriversFiltersBar
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        search={search}
        onSearchChange={handleSearchChange}
        limit={limit}
        showDeleted={showDeleted}
        onShowDeletedChange={setShowDeleted}
        validCertificatesOnly={validCertificatesOnly}
        onValidCertificatesOnlyChange={setValidCertificatesOnly}
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
          canManageDrivers={canManageDrivers}
          isAdmin={isAdminFromHook ?? isAdmin}
          onEdit={setEditDriver}
          onRestore={(id) => restoreMutation.mutate(id)}
          isRestoring={restoreMutation.isPending}
        />
      )}

      {addModalOpen && (
        <DriverFormModal
          title="Add driver"
          submitLabel={createMutation.isPending ? 'Adding...' : 'Add'}
          onClose={() => setAddModalOpen(false)}
          onSubmit={(payload) =>
            createMutation.mutate(payload, {
              onSuccess: () => setAddModalOpen(false),
            })
          }
          isSubmitting={createMutation.isPending}
          errorMessage={extractApiError(createMutation.error)}
        />
      )}

      {editDriver && (
        <DriverFormModal
          title="Edit driver"
          submitLabel={updateMutation.isPending ? 'Saving...' : 'Save'}
          initialData={driverToFormInitialData(editDriver)}
          onClose={() => setEditDriver(null)}
          onSubmit={(payload) =>
            updateMutation.mutate(
              { id: editDriver.id, payload },
              { onSuccess: () => setEditDriver(null) }
            )
          }
          isSubmitting={updateMutation.isPending}
          errorMessage={extractApiError(updateMutation.error)}
        />
      )}
    </div>
  )
}

export default DriversPage
