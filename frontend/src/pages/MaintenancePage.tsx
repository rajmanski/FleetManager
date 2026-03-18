import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { MaintenanceFiltersBar } from '@/components/maintenance/MaintenanceFiltersBar'
import { MaintenanceTable } from '@/components/maintenance/MaintenanceTable'
import { MaintenanceFormModal } from '@/components/maintenance/MaintenanceFormModal'
import { useMaintenanceList } from '@/hooks/maintenance/useMaintenance'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { usePagination } from '@/hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { extractApiError } from '@/utils/api'
import type { MaintenanceFormValues } from '@/schemas/maintenance'

function MaintenancePage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { maintenanceQuery, createMaintenanceMutation } = useMaintenanceList({
    page,
    limit,
    vehicleId: vehicleFilter,
    status: statusFilter,
  })

  const { vehiclesQuery } = useVehicles({
    page: 1,
    limit: 100,
    statusFilter: '',
    search: '',
    showDeleted: false,
  })

  const total = maintenanceQuery.data?.total ?? 0
  const pagination = usePagination({ page, setPage, limit, setLimit, total })

  const rows = useMemo(() => maintenanceQuery.data?.data ?? [], [maintenanceQuery.data])

  const vehicleOptions = useMemo(() => {
    const vehicles = vehiclesQuery.data?.data ?? []
    return vehicles.map((v) => ({
      value: String(v.id),
      label: `${v.vin}${v.plate_number ? ` (${v.plate_number})` : ''}`,
    }))
  }, [vehiclesQuery.data])

  const vehicleLabelsById = useMemo(() => {
    const map: Record<number, string> = {}
    for (const opt of vehicleOptions) {
      const id = Number(opt.value)
      if (Number.isFinite(id)) {
        map[id] = opt.label
      }
    }
    return map
  }, [vehicleOptions])

  const handleStatusChange = useCallback(
    (value: string) => {
      setStatusFilter(value)
      pagination.resetPage()
    },
    [pagination],
  )

  const handleVehicleChange = useCallback(
    (value: string) => {
      setVehicleFilter(value)
      pagination.resetPage()
    },
    [pagination],
  )

  const createCallbacks = useMutationCallbacks({
    successMessage: 'Maintenance record created',
    errorFallback: 'Failed to create maintenance record',
    onSuccess: () => setIsCreateOpen(false),
  })

  const handleCreate = (values: MaintenanceFormValues) => {
    const startDateIso = `${values.scheduledDate}T00:00:00Z`
    createMaintenanceMutation.mutate(
      {
        vehicleId: Number(values.vehicleId),
        startDate: startDateIso,
        type: values.type,
        description: values.description?.trim() ? values.description.trim() : undefined,
        laborCostPln: values.laborCostPln,
        partsCostPln: values.partsCostPln,
      },
      createCallbacks,
    )
  }

  const createError = extractApiError(createMaintenanceMutation.error)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Service and repair records"
        action={
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            Add maintenance
          </Button>
        }
      />

      <MaintenanceFiltersBar
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusChange}
        vehicleFilter={vehicleFilter}
        onVehicleFilterChange={handleVehicleChange}
        vehicleOptions={vehicleOptions}
        limit={limit}
        pagination={pagination}
      />

      {maintenanceQuery.isLoading && <LoadingMessage />}
      {maintenanceQuery.isError && (
        <ErrorMessage message="Failed to load maintenance records." />
      )}

      {maintenanceQuery.isSuccess && (
        <MaintenanceTable
          rows={rows}
          page={page}
          total={total}
          pagination={pagination}
          vehicleLabelsById={vehicleLabelsById}
        />
      )}

      {isCreateOpen && (
        <MaintenanceFormModal
          title="Add maintenance"
          submitLabel="Create"
          vehicleOptions={vehicleOptions}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isSubmitting={createMaintenanceMutation.isPending}
          errorMessage={createError}
        />
      )}
    </div>
  )
}

export default MaintenancePage

