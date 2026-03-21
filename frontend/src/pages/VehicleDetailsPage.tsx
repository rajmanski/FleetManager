import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { DetailItem } from '@/components/ui/DetailItem'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { MileageHistorySection } from '@/components/vehicles/MileageHistorySection'
import { MaintenanceHistorySection } from '@/components/vehicles/MaintenanceHistorySection'
import { VehicleFormModal } from '@/components/vehicles/VehicleFormModal'
import { useVehicle } from '@/hooks/vehicles/useVehicle'
import type { VehicleMutationPayload } from '@/hooks/vehicles/useVehicles'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { vehicleToFormInitialData } from '@/utils/vehicle'
import { extractApiError } from '@/utils/api'
import { formatDateTime } from '@/utils/date'

function VehicleDetailsPage() {
  const { id } = useParams()
  const [editOpen, setEditOpen] = useState(false)

  const deleteCallbacks = useMutationCallbacks({
    successMessage: 'Vehicle deleted',
    errorFallback: 'Failed to delete vehicle',
  })
  const updateCallbacks = useMutationCallbacks({
    successMessage: 'Vehicle updated',
    errorFallback: 'Failed to update vehicle',
    onSuccess: () => setEditOpen(false),
  })

  const vehicleID = Number(id)

  const {
    vehicleQuery,
    deleteMutation,
    updateMutation,
    canManage,
  } = useVehicle(vehicleID)

  if (!Number.isFinite(vehicleID) || vehicleID <= 0) {
    return <ErrorMessage message="Invalid vehicle id." />
  }

  if (vehicleQuery.isLoading) {
    return <LoadingMessage message="Loading vehicle details..." />
  }

  if (vehicleQuery.isError || !vehicleQuery.data) {
    return <ErrorMessage message="Failed to load vehicle details." />
  }

  const vehicle = vehicleQuery.data
  const isDeleted = Boolean(vehicle.deleted_at)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle details"
        description="Full vehicle data and availability information"
        action={
          <Link
            to="/vehicles"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Back to list
          </Link>
        }
      />

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="VIN" value={vehicle.vin} />
          <DetailItem label="Status" value={vehicle.status} />
          <DetailItem label="Brand" value={vehicle.brand ?? '-'} />
          <DetailItem label="Model" value={vehicle.model ?? '-'} />
          <DetailItem label="Production year" value={vehicle.production_year ? String(vehicle.production_year) : '-'} />
          <DetailItem label="Mileage (km)" value={String(vehicle.current_mileage_km ?? 0)} />
          <DetailItem label="Capacity (kg)" value={vehicle.capacity_kg ? String(vehicle.capacity_kg) : '-'} />
          <DetailItem label="Plate number" value={vehicle.plate_number ?? '-'} />
          <DetailItem label="Created at" value={formatDateTime(vehicle.created_at)} />
          <DetailItem label="Updated at" value={formatDateTime(vehicle.updated_at)} />
        </dl>
      </div>

      <MileageHistorySection
        currentMileageKm={vehicle.current_mileage_km}
        recordedAt={vehicle.updated_at ?? vehicle.created_at}
      />

      <MaintenanceHistorySection vehicleId={vehicle.id} />

      <div className="flex flex-wrap items-center gap-2">
        {canManage && !isDeleted && (
          <>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit vehicle
            </Button>
            <Button
              variant="danger-outline"
              onClick={() =>
                deleteMutation.mutate(undefined, deleteCallbacks)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete vehicle'}
            </Button>
          </>
        )}
      </div>

      {deleteMutation.error && (
        <ErrorMessage message={extractApiError(deleteMutation.error, 'Delete failed.') ?? 'Delete failed.'} />
      )}

      {editOpen && vehicle && (
        <VehicleFormModal
          title="Edit vehicle"
          submitLabel={updateMutation.isPending ? 'Saving...' : 'Save'}
          initialData={vehicleToFormInitialData(vehicle)}
          status={vehicle.status}
          onClose={() => setEditOpen(false)}
          onSubmit={(payload) =>
            updateMutation.mutate(
              payload as VehicleMutationPayload & { status: string },
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

export default VehicleDetailsPage
