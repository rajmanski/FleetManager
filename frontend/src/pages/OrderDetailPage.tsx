import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { CargoWaypointMap } from '@/components/orders/CargoWaypointMap'
import { CargoTypeBadges } from '@/components/orders/CargoTypeBadges'
import { useOrder } from '@/hooks/orders/useOrder'
import { useOrderWaypoints } from '@/hooks/orders/useOrderWaypoints'
import { useCargo } from '@/hooks/cargo/useCargo'
import { formatDateTime } from '@/utils/date'
import {
  ArrowLeft,
  ClipboardList,
  Building2,
  CircleDot,
  CalendarClock,
  Banknote,
  Package,
  MapPin,
  Scale,
  Box,
  MapPinned,
} from 'lucide-react'
import { INPUT_CLASS_COMPACT } from '@/constants/inputStyles'

function formatPrice(pln?: number): string {
  if (pln == null) return '-'
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
  }).format(pln)
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const orderId = id ? parseInt(id, 10) : null

  const { orderQuery, order } = useOrder(orderId)
  const { waypoints, dropoffOptions, isLoading: waypointsLoading } =
    useOrderWaypoints(order?.routeId)
  const {
    listQuery: cargoQuery,
    assignWaypointMutation,
  } = useCargo(orderId)

  const cargo = cargoQuery.data?.data ?? []

  if (orderId == null || Number.isNaN(orderId)) {
    return <ErrorMessage message="Invalid order ID" />
  }

  if (orderQuery.isLoading || !order) {
    return <LoadingMessage />
  }

  if (orderQuery.isError) {
    return <ErrorMessage message="Failed to load order." />
  }

  const handleDropoffChange = (cargoId: number, waypointId: number | null) => {
    assignWaypointMutation.mutate({
      cargoId,
      orderId,
      destinationWaypointId: waypointId,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order #${order.id}`}
        description={order.orderNumber}
        action={
          <Link to="/orders">
            <Button
              variant="secondary"
              className="inline-flex items-center whitespace-nowrap"
            >
              <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
              Back to list
            </Button>
          </Link>
        }
      />

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
          <span className="rounded-md bg-indigo-100 p-1.5">
            <ClipboardList className="h-4 w-4 text-indigo-600" />
          </span>
          Order details
        </h3>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-md bg-gray-50/80 p-3">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Client
              </dt>
              <dd className="font-semibold text-gray-900">
                {order.clientCompany ?? '-'}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md bg-gray-50/80 p-3">
            <CircleDot className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    order.status === 'Completed'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'Cancelled'
                        ? 'bg-red-100 text-red-800'
                        : order.status === 'InProgress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {order.status}
                </span>
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md bg-gray-50/80 p-3">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Delivery deadline
              </dt>
              <dd className="font-medium">
                {formatDateTime(order.deliveryDeadline) ?? '-'}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md bg-gray-50/80 p-3">
            <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total price
              </dt>
              <dd className="font-semibold text-gray-900">
                {formatPrice(order.totalPricePln)}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
          <span className="rounded-md bg-amber-100 p-1.5">
            <Package className="h-4 w-4 text-amber-700" />
          </span>
          Cargo
        </h3>
        {cargoQuery.isLoading && <LoadingMessage />}
        {cargoQuery.isSuccess && cargo.length === 0 && (
          <p className="flex items-center gap-2 rounded-md bg-gray-50 p-4 text-sm text-gray-500">
            <Package className="h-4 w-4 text-gray-400" />
            No cargo items.
          </p>
        )}
        {cargoQuery.isSuccess && cargo.length > 0 && (
          <div className="space-y-3">
            {cargo.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-gray-100 bg-gradient-to-br from-gray-50 to-slate-50/50 p-4 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                    #{item.id}
                  </span>
                  <span className="font-medium text-gray-800">
                    {item.description || '—'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <Scale className="h-4 w-4" />
                    {item.weightKg} kg
                  </span>
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <Box className="h-4 w-4" />
                    {item.volumeM3} m³
                  </span>
                  <CargoTypeBadges cargoTypesStr={item.cargoType} />
                </div>
                {dropoffOptions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-gray-500" />
                    <label className="text-xs font-medium text-gray-600">
                      Dropoff point:
                    </label>
                    <select
                      value={item.destinationWaypointId ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        handleDropoffChange(
                          item.id,
                          v === '' ? null : parseInt(v, 10)
                        )
                      }}
                      disabled={assignWaypointMutation.isPending}
                      className={INPUT_CLASS_COMPACT}
                    >
                      <option value="">No specific point</option>
                      {dropoffOptions.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.address}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!waypointsLoading &&
        waypoints.length > 0 &&
        cargo.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <span className="rounded-md bg-emerald-100 p-1.5">
                <MapPin className="h-4 w-4 text-emerald-700" />
              </span>
              Cargo → waypoint map
            </h3>
            <CargoWaypointMap waypoints={waypoints} cargo={cargo} />
          </div>
        )}
    </div>
  )
}
