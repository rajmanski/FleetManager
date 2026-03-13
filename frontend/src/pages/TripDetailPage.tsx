import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useTrip } from '@/hooks/trips/useTrip'
import { useTrips } from '@/hooks/trips/useTrips'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { formatDateTime } from '@/utils/date'
import {
  ArrowLeft,
  Truck,
  UserCircle,
  ClipboardList,
  CalendarClock,
  MapPin,
  Route as RouteIcon,
} from 'lucide-react'

function FinishTripModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (distanceKm: number) => void
  isSubmitting: boolean
}) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Please provide a positive distance in kilometers.')
      return
    }
    onSubmit(parsed)
  }

  return (
    <Modal title="Finish trip" error={error}>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Input
          label="Actual distance (km)"
          type="number"
          variant="numericDecimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Finishing...' : 'Finish trip'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const tripId = id ? parseInt(id, 10) : null

  const { tripQuery, trip } = useTrip(tripId)
  const { startTripMutation, finishTripMutation, abortTripMutation } = useTrips()

  const startCallbacks = useMutationCallbacks({
    successMessage: 'Trip started',
    errorFallback: 'Failed to start trip',
  })

  const finishCallbacks = useMutationCallbacks({
    successMessage: 'Trip finished',
    errorFallback: 'Failed to finish trip',
  })

  const abortCallbacks = useMutationCallbacks({
    successMessage: 'Trip aborted',
    errorFallback: 'Failed to abort trip',
  })

  const [finishModalOpen, setFinishModalOpen] = useState(false)

  if (tripId == null || Number.isNaN(tripId)) {
    return <ErrorMessage message="Invalid trip ID" />
  }

  if (tripQuery.isLoading || !trip) {
    return <LoadingMessage />
  }

  if (tripQuery.isError) {
    return <ErrorMessage message="Failed to load trip." />
  }

  const canStart = trip.status === 'Scheduled'
  const canFinish = trip.status === 'Active'
  const canAbort = trip.status === 'Scheduled' || trip.status === 'Active'

  const handleStart = () => {
    startTripMutation.mutate(tripId, startCallbacks)
  }

  const handleFinish = (distanceKm: number) => {
    finishTripMutation.mutate(
      { tripId, actualDistanceKm: distanceKm },
      {
        onSuccess: () => {
          finishCallbacks.onSuccess()
          setFinishModalOpen(false)
        },
        onError: finishCallbacks.onError,
      }
    )
  }

  const handleAbort = () => {
    if (!window.confirm('Are you sure you want to abort this trip?')) {
      return
    }
    abortTripMutation.mutate(tripId, abortCallbacks)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Trip #${trip.id}`}
        description={`Order ${trip.order_number}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {canStart && (
              <Button
                variant="primary"
                onClick={handleStart}
                disabled={startTripMutation.isPending}
              >
                Start trip
              </Button>
            )}
            {canFinish && (
              <Button
                variant="primary"
                onClick={() => setFinishModalOpen(true)}
                disabled={finishTripMutation.isPending}
              >
                Finish trip
              </Button>
            )}
            {canAbort && (
              <Button
                variant="danger"
                onClick={handleAbort}
                disabled={abortTripMutation.isPending}
              >
                Abort trip
              </Button>
            )}
            <Link to="/trips">
              <Button
                variant="secondary"
                className="inline-flex items-center whitespace-nowrap"
              >
                <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                Back to list
              </Button>
            </Link>
          </div>
        }
      />

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
          <span className="rounded-md bg-indigo-100 p-1.5">
            <ClipboardList className="h-4 w-4 text-indigo-600" />
          </span>
          Basic information
        </h3>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-md bg-gray-50/80 p-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Client
              </dt>
              <dd className="font-semibold text-gray-900">
                {trip.client_company}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md bg-gray-50/80 p-3">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </dt>
              <dd className="font-medium text-gray-900">{trip.status}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md bg-gray-50/80 p-3">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Start time
              </dt>
              <dd className="font-medium">
                {formatDateTime(trip.start_time)}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md bg-gray-50/80 p-3">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                End time
              </dt>
              <dd className="font-medium">
                {formatDateTime(trip.end_time)}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md bg-gray-50/80 p-3">
            <RouteIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Distance (planned / actual km)
              </dt>
              <dd className="font-medium">
                {(trip.planned_distance_km ?? '-').toString()} /{' '}
                {(trip.actual_distance_km ?? '-').toString()}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="rounded-md bg-slate-100 p-1.5">
              <Truck className="h-4 w-4 text-slate-700" />
            </span>
            Vehicle
          </h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Vehicle ID
              </dt>
              <dd className="font-medium text-gray-900">{trip.vehicle_id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                VIN
              </dt>
              <dd className="font-mono text-sm text-gray-900">
                {trip.vehicle_vin}
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="rounded-md bg-slate-100 p-1.5">
              <UserCircle className="h-4 w-4 text-slate-700" />
            </span>
            Driver
          </h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Driver ID
              </dt>
              <dd className="font-medium text-gray-900">{trip.driver_id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Name
              </dt>
              <dd className="font-medium text-gray-900">{trip.driver_name}</dd>
            </div>
          </dl>
        </div>
      </div>

      <FinishTripModal
        isOpen={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        onSubmit={handleFinish}
        isSubmitting={finishTripMutation.isPending}
      />
    </div>
  )
}

export default TripDetailPage

