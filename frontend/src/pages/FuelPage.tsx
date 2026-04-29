import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { FuelFiltersBar } from '@/components/fuel/FuelFiltersBar'
import { FuelFormModal } from '@/components/fuel/FuelFormModal'
import { FuelTable } from '@/components/fuel/FuelTable'
import { useFuelLogs } from '@/hooks/fuel/useFuel'
import { useAuth } from '@/hooks/useAuth'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { usePagination } from '@/hooks/usePagination'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { extractApiError } from '@/utils/api'
import type { FuelFormValues } from '@/schemas/fuel'
import { FilterCheckbox } from '@/components/ui/FilterCheckbox'

function FuelPage() {
  const { canManageFuelLogs } = useAuth()
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [onlyAnomalies, setOnlyAnomalies] = useState(false)

  const { fuelLogsQuery, createFuelLogMutation } = useFuelLogs({
    page,
    limit,
    vehicleId: vehicleFilter,
    dateFrom,
    dateTo,
  })

  const { vehiclesQuery } = useVehicles({
    page: 1,
    limit: 100,
    statusFilter: '',
    search: '',
    showDeleted: false,
  })

  const total = fuelLogsQuery.data?.total ?? 0
  const pagination = usePagination({ page, setPage, limit, setLimit, total })
  const rows = useMemo(() => fuelLogsQuery.data?.data ?? [], [fuelLogsQuery.data])
  const anomaliesCount = useMemo(
    () => rows.filter((r) => r.is_anomaly).length,
    [rows],
  )
  const visibleRows = useMemo(
    () => (onlyAnomalies ? rows.filter((r) => r.is_anomaly) : rows),
    [onlyAnomalies, rows],
  )

  const vehicleOptions = useMemo(() => {
    const vehicles = vehiclesQuery.data?.data ?? []
    return vehicles.map((v) => ({
      value: String(v.id),
      label: `${v.vin}${v.plate_number ? ` (${v.plate_number})` : ''}`,
      currentMileageKm: v.current_mileage_km ?? 0,
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

  const handleVehicleChange = useCallback(
    (value: string) => {
      setVehicleFilter(value)
      pagination.resetPage()
    },
    [pagination],
  )

  const handleDateFromChange = useCallback(
    (value: string) => {
      setDateFrom(value)
      pagination.resetPage()
    },
    [pagination],
  )

  const handleDateToChange = useCallback(
    (value: string) => {
      setDateTo(value)
      pagination.resetPage()
    },
    [pagination],
  )

  const createCallbacks = useMutationCallbacks({
    successMessage: 'Fuel log created',
    errorFallback: 'Failed to create fuel log',
    onSuccess: () => setIsCreateOpen(false),
  })

  const handleCreate = (values: FuelFormValues) => {
    createFuelLogMutation.mutate(
      {
        vehicle_id: Number(values.vehicleId),
        date: values.date,
        liters: values.liters,
        price_per_liter: values.pricePerLiter,
        mileage: values.mileage,
        location: (values.location ?? '').trim(),
      },
      createCallbacks,
    )
  }

  const createError = extractApiError(createFuelLogMutation.error)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel logs"
        description="Fuel refueling records with mileage tracking and anomaly detection"
        action={
          <div className="flex flex-wrap items-center gap-3">
            {canManageFuelLogs ? (
              <Button type="button" onClick={() => setIsCreateOpen(true)}>
                Add fuel log
              </Button>
            ) : undefined}

            <div className="flex items-center gap-3">
              <FilterCheckbox
                checked={onlyAnomalies}
                onChange={setOnlyAnomalies}
                label="Show only anomalies"
              />
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Anomalies: {anomaliesCount}
              </span>
            </div>
          </div>
        }
      />

      <FuelFiltersBar
        vehicleFilter={vehicleFilter}
        onVehicleFilterChange={handleVehicleChange}
        dateFrom={dateFrom}
        onDateFromChange={handleDateFromChange}
        dateTo={dateTo}
        onDateToChange={handleDateToChange}
        vehicleOptions={vehicleOptions}
        limit={limit}
        pagination={pagination}
      />

      {fuelLogsQuery.isLoading && <LoadingMessage />}
      {fuelLogsQuery.isError && <ErrorMessage message="Failed to load fuel logs." />}

      {fuelLogsQuery.isSuccess && (
        <FuelTable
          rows={visibleRows}
          page={page}
          total={total}
          pagination={pagination}
          vehicleLabelsById={vehicleLabelsById}
        />
      )}

      {isCreateOpen && (
        <FuelFormModal
          title="Add fuel log"
          submitLabel="Create"
          vehicleOptions={vehicleOptions}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isSubmitting={createFuelLogMutation.isPending}
          errorMessage={createError}
        />
      )}
    </div>
  )
}

export default FuelPage

