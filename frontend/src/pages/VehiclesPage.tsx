import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { VehicleFormModal } from '@/components/vehicles/VehicleFormModal'
import { VehiclesFiltersBar } from '@/components/vehicles/VehiclesFiltersBar'
import { VehiclesTable } from '@/components/vehicles/VehiclesTable'
import { useVehicles, type Vehicle, type VehicleMutationPayload } from '@/hooks/vehicles/useVehicles'
import { useAuth } from '@/hooks/useAuth'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { usePagination } from '@/hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { vehicleToFormInitialData } from '@/utils/vehicle'
import { extractApiError } from '@/utils/api'

function VehiclesPage() {
  const { canManageVehicles, isAdmin } = useAuth()
  const [showDeleted, setShowDeleted] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)

  const restoreCallbacks = useMutationCallbacks({
    successMessage: 'Vehicle restored',
    errorFallback: 'Failed to restore vehicle',
  })
  const createCallbacks = useMutationCallbacks({
    successMessage: 'Vehicle added',
    errorFallback: 'Failed to add vehicle',
    onSuccess: () => setAddModalOpen(false),
  })
  const updateCallbacks = useMutationCallbacks({
    successMessage: 'Vehicle updated',
    errorFallback: 'Failed to update vehicle',
    onSuccess: () => setEditVehicle(null),
  })

  const {
    vehiclesQuery,
    restoreMutation,
    createMutation,
    updateMutation,
  } = useVehicles({ page, limit, statusFilter, search, showDeleted })

  const vehicles = useMemo(() => vehiclesQuery.data?.data ?? [], [vehiclesQuery.data])
  const total = vehiclesQuery.data?.total ?? 0
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
        title="Vehicles"
        description="Fleet vehicles list with archived records handling"
        action={
          canManageVehicles ? (
            <Button onClick={() => setAddModalOpen(true)}>Add vehicle</Button>
          ) : undefined
        }
      />

      <VehiclesFiltersBar
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        search={search}
        onSearchChange={handleSearchChange}
        limit={limit}
        showDeleted={showDeleted}
        onShowDeletedChange={setShowDeleted}
        pagination={pagination}
        isAdmin={isAdmin}
      />

      {vehiclesQuery.isLoading && <LoadingMessage />}
      {vehiclesQuery.isError && (
        <ErrorMessage message="Failed to load vehicles." />
      )}

      {vehiclesQuery.isSuccess && (
        <VehiclesTable
          vehicles={vehicles}
          page={page}
          total={total}
          pagination={pagination}
          canManageVehicles={canManageVehicles}
          isAdmin={isAdmin}
          onEdit={setEditVehicle}
          onRestore={(id) =>
            restoreMutation.mutate(id, restoreCallbacks)
          }
          isRestoring={restoreMutation.isPending}
        />
      )}

      {addModalOpen && (
        <VehicleFormModal
          title="Add vehicle"
          submitLabel={createMutation.isPending ? 'Adding...' : 'Add'}
          onClose={() => setAddModalOpen(false)}
          onSubmit={(payload) =>
            createMutation.mutate(payload, createCallbacks)
          }
          isSubmitting={createMutation.isPending}
          errorMessage={extractApiError(createMutation.error)}
        />
      )}

      {editVehicle && (
        <VehicleFormModal
          title="Edit vehicle"
          submitLabel={updateMutation.isPending ? 'Saving...' : 'Save'}
          initialData={vehicleToFormInitialData(editVehicle)}
          onClose={() => setEditVehicle(null)}
          onSubmit={(payload) =>
            updateMutation.mutate(
              {
                id: editVehicle.id,
                payload: payload as VehicleMutationPayload & { status: string },
              },
              updateCallbacks
            )
          }
          isSubmitting={updateMutation.isPending}
          errorMessage={extractApiError(updateMutation.error)}
        />
      )}
    </div>
  )
}

export default VehiclesPage
