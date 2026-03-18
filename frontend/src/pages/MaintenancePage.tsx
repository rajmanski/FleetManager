import { useCallback, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { MaintenanceFiltersBar } from '@/components/maintenance/MaintenanceFiltersBar'
import { MaintenanceTable } from '@/components/maintenance/MaintenanceTable'
import { useMaintenanceList } from '@/hooks/maintenance/useMaintenance'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { usePagination } from '@/hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

function MaintenancePage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)

  const { maintenanceQuery } = useMaintenanceList({
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

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" description="Service and repair records" />

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
    </div>
  )
}

export default MaintenancePage

