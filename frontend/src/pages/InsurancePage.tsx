import { useCallback, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { InsuranceFiltersBar } from '@/components/insurance/InsuranceFiltersBar'
import { InsuranceTable } from '@/components/insurance/InsuranceTable'
import { useInsuranceList } from '@/hooks/insurance/useInsurance'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { usePagination } from '@/hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

function InsurancePage() {
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)

  const { insuranceQuery } = useInsuranceList({
    page,
    limit,
    vehicleId: vehicleFilter,
  })

  const { vehiclesQuery } = useVehicles({
    page: 1,
    limit: 100,
    statusFilter: '',
    search: '',
    showDeleted: false,
  })

  const total = insuranceQuery.data?.total ?? 0
  const pagination = usePagination({ page, setPage, limit, setLimit, total })

  const rows = useMemo(() => insuranceQuery.data?.data ?? [], [insuranceQuery.data])

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insurance"
        description="Vehicle insurance policies (validity by end date)"
      />

      <InsuranceFiltersBar
        vehicleFilter={vehicleFilter}
        onVehicleFilterChange={handleVehicleChange}
        vehicleOptions={vehicleOptions}
        limit={limit}
        pagination={pagination}
      />

      {insuranceQuery.isLoading && <LoadingMessage />}
      {insuranceQuery.isError && <ErrorMessage message="Failed to load insurance policies." />}

      {insuranceQuery.isSuccess && (
        <InsuranceTable
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

export default InsurancePage
