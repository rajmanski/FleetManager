import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { DriverFormModal } from '@/components/drivers/DriverFormModal'
import { RecordChangelogModal } from '@/components/changelog/RecordChangelogModal'
import { DriversFiltersBar } from '@/components/drivers/DriversFiltersBar'
import { DriversTable } from '@/components/drivers/DriversTable'
import { useDrivers, type Driver } from '@/hooks/drivers/useDrivers'
import { useAuth } from '@/hooks/useAuth'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
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
  const [historyDriver, setHistoryDriver] = useState<Driver | null>(null)
  const [softDeletingId, setSoftDeletingId] = useState<number | null>(null)

  const restoreCallbacks = useMutationCallbacks({
    successMessage: 'Driver restored',
    errorFallback: 'Failed to restore driver',
  })
  const createCallbacks = useMutationCallbacks({
    successMessage: 'Driver added',
    errorFallback: 'Failed to add driver',
    onSuccess: () => setAddModalOpen(false),
  })
  const updateCallbacks = useMutationCallbacks({
    successMessage: 'Driver updated',
    errorFallback: 'Failed to update driver',
    onSuccess: () => setEditDriver(null),
  })

  const {
    driversQuery,
    restoreMutation,
    createMutation,
    updateMutation,
    softDeleteMutation,
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

  const handleSoftDelete = useCallback(
    (driver: Driver) => {
      if (!isAdmin) return
      const confirmed = window.confirm(
        `Are you sure you want to soft delete driver "${driver.first_name} ${driver.last_name}"?`
      )
      if (!confirmed) return

      setSoftDeletingId(driver.id)
      softDeleteMutation.mutate(driver.id, {
        onSuccess: () => {
          setSoftDeletingId(null)
          window.alert('Driver soft deleted.')
        },
        onError: () => {
          setSoftDeletingId(null)
          window.alert('Failed to soft delete driver.')
        },
      })
    },
    [isAdmin, softDeleteMutation]
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
          onRestore={(id) =>
            restoreMutation.mutate(id, restoreCallbacks)
          }
          onHistory={setHistoryDriver}
          isRestoring={restoreMutation.isPending}
          onSoftDelete={handleSoftDelete}
          softDeletingId={softDeletingId}
        />
      )}

      {addModalOpen && (
        <DriverFormModal
          title="Add driver"
          submitLabel={createMutation.isPending ? 'Adding...' : 'Add'}
          onClose={() => setAddModalOpen(false)}
          onSubmit={(payload) =>
            createMutation.mutate(payload, createCallbacks)
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
            updateMutation.mutate({ id: editDriver.id, payload }, updateCallbacks)
          }
          isSubmitting={updateMutation.isPending}
          errorMessage={extractApiError(updateMutation.error)}
        />
      )}

      {historyDriver && (
        <RecordChangelogModal
          open
          title={`Change history for driver #${historyDriver.id}`}
          tableName="drivers"
          recordId={historyDriver.id}
          onClose={() => setHistoryDriver(null)}
        />
      )}
    </div>
  )
}

export default DriversPage
