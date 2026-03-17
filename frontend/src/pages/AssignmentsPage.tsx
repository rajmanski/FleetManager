import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { AssignmentsTable } from '@/components/assignments/AssignmentsTable'
import { useAssignments } from '@/hooks/assignments/useAssignments'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { useDrivers } from '@/hooks/drivers/useDrivers'
import { usePagination } from '@/hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { extractApiError } from '@/utils/api'

function AssignmentsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [showHistory, setShowHistory] = useState(false)
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [assignedFromDate, setAssignedFromDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  )

  const {
    assignmentsQuery: activeAssignmentsQuery,
    endAssignmentMutation,
  } = useAssignments({ page, limit, activeOnly: true })

  const { assignmentsQuery: allAssignmentsQuery } = useAssignments({
    page: 1,
    limit: 50,
    activeOnly: false,
  })

  const {
    vehiclesQuery,
  } = useVehicles({
    page: 1,
    limit: 100,
    statusFilter: '',
    search: '',
    showDeleted: false,
  })

  const {
    driversQuery,
  } = useDrivers({
    page: 1,
    limit: 100,
    statusFilter: '',
    search: '',
    showDeleted: false,
  })

  const {
    createAssignmentMutation,
  } = useAssignments({ page: 1, limit: 1, activeOnly: true })

  const createCallbacks = useMutationCallbacks({
    successMessage: 'Assignment created',
    errorFallback: 'Failed to create assignment',
  })

  const endCallbacks = useMutationCallbacks({
    successMessage: 'Assignment ended',
    errorFallback: 'Failed to end assignment',
  })

  const activeAssignments = useMemo(
    () => activeAssignmentsQuery.data?.data ?? [],
    [activeAssignmentsQuery.data]
  )
  const totalActive = activeAssignmentsQuery.data?.total ?? activeAssignments.length

  const pagination = usePagination({
    page,
    setPage,
    limit,
    setLimit,
    total: totalActive,
  })

  const historyAssignments = useMemo(
    () =>
      (allAssignmentsQuery.data?.data ?? []).filter(
        (a) => a.assigned_to != null
      ),
    [allAssignmentsQuery.data]
  )

  const vehicles = useMemo(
    () => vehiclesQuery.data?.data ?? [],
    [vehiclesQuery.data]
  )
  const drivers = useMemo(
    () => driversQuery.data?.data ?? [],
    [driversQuery.data]
  )

  useEffect(() => {
    if (!vehicleId && vehicles.length > 0) {
      setVehicleId(String(vehicles[0].id))
    }
  }, [vehicles, vehicleId])

  useEffect(() => {
    if (!driverId && drivers.length > 0) {
      setDriverId(String(drivers[0].id))
    }
  }, [drivers, driverId])

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleId || !driverId || !assignedFromDate) {
      return
    }
    const isoDate = `${assignedFromDate}T00:00:00Z`
    createAssignmentMutation.mutate(
      {
        vehicle_id: Number(vehicleId),
        driver_id: Number(driverId),
        assigned_from: isoDate,
      },
      createCallbacks
    )
  }

  const handleEndAssignment = useCallback(
    (assignmentId: number) => {
      endAssignmentMutation.mutate(assignmentId, endCallbacks)
    },
    [endAssignmentMutation, endCallbacks]
  )

  const createError = extractApiError(createAssignmentMutation.error)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Long-term driver to vehicle assignments"
      />

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-800">
          Create assignment
        </h3>
        <form
          onSubmit={handleCreateAssignment}
          className="grid gap-4 md:grid-cols-3"
        >
          <Select
            label="Vehicle"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            options={vehicles.map((v) => ({
              value: v.id,
              label: `${v.vin} ${v.plate_number ? `(${v.plate_number})` : ''}`,
            }))}
            required
            disabled={vehiclesQuery.isLoading || createAssignmentMutation.isPending}
          />
          <Select
            label="Driver"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            options={drivers.map((d) => ({
              value: d.id,
              label: `${d.first_name} ${d.last_name}`,
            }))}
            required
            disabled={driversQuery.isLoading || createAssignmentMutation.isPending}
          />
          <Input
            label="Assigned from"
            type="date"
            value={assignedFromDate}
            onChange={(e) => setAssignedFromDate(e.target.value)}
            required
          />
          <div className="md:col-span-3 flex justify-end">
            <Button
              type="submit"
              disabled={createAssignmentMutation.isPending}
            >
              {createAssignmentMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
        {createError && !createAssignmentMutation.isPending && (
          <div className="mt-3">
            <ErrorMessage message={createError} />
          </div>
        )}
      </div>

      {activeAssignmentsQuery.isLoading && <LoadingMessage />}
      {activeAssignmentsQuery.isError && (
        <ErrorMessage message="Failed to load assignments." />
      )}
      {activeAssignmentsQuery.isSuccess && (
        <AssignmentsTable
          assignments={activeAssignments}
          page={page}
          total={totalActive}
          pagination={pagination}
          showActions
          onEndAssignment={handleEndAssignment}
          isEnding={endAssignmentMutation.isPending}
        />
      )}

      <div className="space-y-3">
        <button
          type="button"
          className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline"
          onClick={() => setShowHistory((prev) => !prev)}
        >
          {showHistory ? 'Hide history' : 'Show history'}
        </button>
        {showHistory && (
          <>
            {allAssignmentsQuery.isLoading && <LoadingMessage />}
            {allAssignmentsQuery.isError && (
              <ErrorMessage message="Failed to load assignment history." />
            )}
            {allAssignmentsQuery.isSuccess && historyAssignments.length === 0 && (
              <p className="text-sm text-gray-500">No historical assignments.</p>
            )}

            {allAssignmentsQuery.isSuccess && historyAssignments.length > 0 && (
              <AssignmentsTable
                assignments={historyAssignments}
                page={1}
                total={historyAssignments.length}
                pagination={{
                  totalPages: 1,
                  canGoPrev: false,
                  canGoNext: false,
                  goPrev: () => {},
                  goNext: () => {},
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AssignmentsPage

