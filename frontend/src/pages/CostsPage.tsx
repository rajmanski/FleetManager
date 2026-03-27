import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { CostsFiltersBar } from '@/components/costs/CostsFiltersBar'
import { CostsFormModal } from '@/components/costs/CostsFormModal'
import { CostsTable } from '@/components/costs/CostsTable'
import { useCosts } from '@/hooks/costs/useCosts'
import { useAuth } from '@/hooks/useAuth'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { usePagination } from '@/hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { extractApiError } from '@/utils/api'
import type { CostsFormValues } from '@/schemas/costs'

function CostsPage() {
  const { canManageFuelLogs } = useAuth()
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { costsQuery, createCostMutation } = useCosts({
    page,
    limit,
    vehicleId: vehicleFilter,
    category: categoryFilter,
  })

  const { vehiclesQuery } = useVehicles({
    page: 1,
    limit: 100,
    statusFilter: '',
    search: '',
    showDeleted: false,
  })

  const total = costsQuery.data?.total ?? 0
  const pagination = usePagination({ page, setPage, limit, setLimit, total })
  const rows = useMemo(() => costsQuery.data?.data ?? [], [costsQuery.data])

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

  const handleCategoryChange = useCallback(
    (value: string) => {
      setCategoryFilter(value)
      pagination.resetPage()
    },
    [pagination],
  )

  const createCallbacks = useMutationCallbacks({
    successMessage: 'Cost created',
    errorFallback: 'Failed to create cost',
    onSuccess: () => setIsCreateOpen(false),
  })

  const handleCreate = (values: CostsFormValues) => {
    createCostMutation.mutate(
      {
        vehicleId: Number(values.vehicleId),
        category: values.category,
        amount: values.amount,
        date: values.date,
        description: values.description?.trim() ? values.description.trim() : undefined,
        invoiceNumber: values.invoiceNumber?.trim() ? values.invoiceNumber.trim() : undefined,
      },
      createCallbacks,
    )
  }

  const createError = extractApiError(createCostMutation.error)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Costs"
        description="Operational costs (tolls/other)"
        action={
          canManageFuelLogs ? (
            <Button type="button" onClick={() => setIsCreateOpen(true)}>
              Add cost
            </Button>
          ) : undefined
        }
      />

      <CostsFiltersBar
        vehicleFilter={vehicleFilter}
        onVehicleFilterChange={handleVehicleChange}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={handleCategoryChange}
        vehicleOptions={vehicleOptions}
        limit={limit}
        pagination={pagination}
      />

      {costsQuery.isLoading && <LoadingMessage />}
      {costsQuery.isError && <ErrorMessage message="Failed to load costs." />}

      {costsQuery.isSuccess && (
        <CostsTable
          rows={rows}
          page={page}
          total={total}
          pagination={pagination}
          vehicleLabelsById={vehicleLabelsById}
        />
      )}

      {isCreateOpen && (
        <CostsFormModal
          title="Add cost"
          submitLabel="Create"
          vehicleOptions={vehicleOptions}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isSubmitting={createCostMutation.isPending}
          errorMessage={createError}
        />
      )}
    </div>
  )
}

export default CostsPage

