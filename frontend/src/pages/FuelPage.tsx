import { useCallback, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { FuelFiltersBar } from '@/components/fuel/FuelFiltersBar'
import { FuelTable } from '@/components/fuel/FuelTable'
import { useFuelLogs } from '@/hooks/fuel/useFuel'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { usePagination } from '@/hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

function FuelPage() {
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)

  const { fuelLogsQuery } = useFuelLogs({
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel logs"
        description="Fuel refuels with mileage and anomaly warning marker"
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

export default FuelPage

