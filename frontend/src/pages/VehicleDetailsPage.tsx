import { useState } from 'react'
import { Gauge, Hash, Truck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { DetailItem } from '@/components/ui/DetailItem'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { MileageHistorySection } from '@/components/vehicles/MileageHistorySection'
import { MaintenanceHistorySection } from '@/components/vehicles/MaintenanceHistorySection'
import { VehicleFormModal } from '@/components/vehicles/VehicleFormModal'
import { RecordChangelogModal } from '@/components/changelog/RecordChangelogModal'
import { useVehicle } from '@/hooks/vehicles/useVehicle'
import { useAuth } from '@/hooks/useAuth'
import type { VehicleMutationPayload } from '@/hooks/vehicles/useVehicles'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { vehicleToFormInitialData } from '@/utils/vehicle'
import { extractApiError } from '@/utils/api'
import { formatDateTime } from '@/utils/date'
import { formatVehicleStatusLabel, getVehicleStatusMeta } from '@/utils/vehicleStatus'

function VehicleDetailsPage() {
  const { id } = useParams()
  const [editOpen, setEditOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const { isAdmin } = useAuth()

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
  const statusMeta = getVehicleStatusMeta(vehicle.status)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Vehicle ${vehicle.vin}`}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard
          label="Status"
          value={formatVehicleStatusLabel(vehicle.status)}
          icon={<statusMeta.Icon className={`size-4 ${statusMeta.colorClass}`} aria-hidden="true" />}
          hint={statusMeta.description}
        />
        <InfoCard
          label="Mileage"
          value={`${vehicle.current_mileage_km ?? 0} km`}
          icon={<Gauge className="size-4 text-slate-700" aria-hidden="true" />}
          hint="Latest odometer snapshot."
        />
        <InfoCard
          label="Plate number"
          value={vehicle.plate_number ?? '-'}
          icon={<Hash className="size-4 text-slate-700" aria-hidden="true" />}
          hint="Registration identifier."
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Truck className="size-4 text-slate-700" aria-hidden="true" />
          <h3 className="text-base font-semibold text-gray-800">Technical details</h3>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="VIN" value={vehicle.vin} />
          <DetailItem label="Status" value={formatVehicleStatusLabel(vehicle.status)} />
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
        {isAdmin && (
          <Button variant="secondary" onClick={() => setHistoryOpen(true)}>
            History
          </Button>
        )}
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

      <RecordChangelogModal
        open={historyOpen}
        title={`Change history for vehicle #${vehicle.id}`}
        tableName="vehicles"
        recordId={vehicle.id}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  )
}

type InfoCardProps = {
  label: string
  value: string
  icon: React.ReactNode
  hint: string
}

function InfoCard({ label, value, icon, hint }: InfoCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  )
}

export default VehicleDetailsPage
