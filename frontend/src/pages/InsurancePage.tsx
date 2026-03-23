import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { InsuranceFiltersBar } from '@/components/insurance/InsuranceFiltersBar'
import { InsuranceFormModal } from '@/components/insurance/InsuranceFormModal'
import { InsuranceTable } from '@/components/insurance/InsuranceTable'
import { useInsuranceList } from '@/hooks/insurance/useInsurance'
import { useAuth } from '@/hooks/useAuth'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { usePagination } from '@/hooks/usePagination'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { extractApiError } from '@/utils/api'
import type { InsuranceFormValues } from '@/schemas/insurance'

function InsurancePage() {
  const { canManageInsurancePolicies } = useAuth()
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { insuranceQuery, createInsuranceMutation } = useInsuranceList({
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

  const createCallbacks = useMutationCallbacks({
    successMessage: 'Insurance policy created',
    errorFallback: 'Failed to create insurance policy',
    onSuccess: () => setIsCreateOpen(false),
  })

  const handleCreate = (values: InsuranceFormValues) => {
    createInsuranceMutation.mutate(
      {
        vehicleId: Number(values.vehicleId),
        type: values.type,
        policyNumber: values.policyNumber,
        insurer: values.insurer,
        startDate: values.startDate,
        endDate: values.endDate,
        cost: values.cost,
      },
      createCallbacks,
    )
  }

  const createError = extractApiError(createInsuranceMutation.error)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insurance"
        description="Vehicle insurance policies (validity by end date)"
        action={
          canManageInsurancePolicies ? (
            <Button type="button" onClick={() => setIsCreateOpen(true)}>
              Add policy
            </Button>
          ) : undefined
        }
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

      {isCreateOpen && (
        <InsuranceFormModal
          title="Add insurance policy"
          submitLabel="Create"
          vehicleOptions={vehicleOptions}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isSubmitting={createInsuranceMutation.isPending}
          errorMessage={createError}
        />
      )}
    </div>
  )
}

export default InsurancePage
