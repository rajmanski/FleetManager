import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { ClientAutocompleteInput } from '@/components/clients/ClientAutocompleteInput'
import { CargoSection, type WaypointOption } from '@/components/orders/CargoSection'
import { RouteMap } from '@/components/routes/RouteMap'
import { RoutePlanningForm } from '@/components/routes/RoutePlanningForm'
import { useRoutePlanning } from '@/hooks/routes/useRoutePlanning'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { useDrivers } from '@/hooks/drivers/useDrivers'
import { useToast } from '@/context/ToastContext'
import type { Client } from '@/hooks/clients/useClients'
import { EMPTY_CARGO_ITEM } from '@/schemas/cargo'
import type { CargoItemDraft } from '@/schemas/cargo'
import {
  orderPlanningFormSchema,
  type OrderPlanningFormValues,
} from '@/schemas/orderPlanning'
import { planOrderWorkflow } from '@/services/operations'
import { extractApiError } from '@/utils/api'
import type { CargoItemErrors } from '@/utils/cargo'
import { generateCargoId } from '@/utils/cargo'
import { loadMapsLibrary } from '@/utils/googleMapsLoader'
import {
  buildPlanOrderWorkflowRequestDTO,
} from '@/utils/orderPlanning'
import type { WorkflowValidationErrorBody } from '@/types/operations'
import type { Path } from 'react-hook-form'

function applyWorkflowApiErrors(
  err: unknown,
  setError: (
    name: Path<OrderPlanningFormValues>,
    error: { message: string },
  ) => void,
): string {
  if (!isAxiosError(err)) {
    return extractApiError(err) ?? 'Request failed.'
  }
  const body = err.response?.data as
    | { error?: string | WorkflowValidationErrorBody }
    | undefined
  const inner = body?.error
  if (typeof inner === 'object' && inner.field_errors?.length) {
    for (const fe of inner.field_errors) {
      const p = mapWorkflowFieldToFormPath(fe.field)
      if (p) {
        setError(p, { message: fe.message })
      }
    }
    return inner.message ?? 'Validation failed.'
  }
  return extractApiError(err) ?? 'Request failed.'
}

function mapWorkflowFieldToFormPath(
  field: string,
): Path<OrderPlanningFormValues> | null {
  const top: Record<string, Path<OrderPlanningFormValues>> = {
    'order.client_id': 'clientId',
    'order.order_number': 'orderNumber',
    'order.delivery_deadline': 'deliveryDeadline',
    'order.total_price_pln': 'totalPricePln',
    'trip.vehicle_id': 'vehicleId',
    'trip.driver_id': 'driverId',
    'trip.start_time': 'startTime',
  }
  if (top[field]) {
    return top[field]!
  }
  const m = /^cargo\[(\d+)\]\.(.+)$/.exec(field)
  if (m) {
    const idx = m[1]
    const sub = m[2]
    const snakeToCamel: Record<string, string> = {
      weight_kg: 'weightPerUnitKg',
      volume_m3: 'volumePerUnitM3',
      cargo_type: 'cargoType',
      description: 'description',
      quantity: 'quantity',
    }
    const key = snakeToCamel[sub] ?? sub
    return `cargo.${idx}.${key}` as Path<OrderPlanningFormValues>
  }
  return null
}

export default function OrderPlanningFlowPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [routeFlowError, setRouteFlowError] = useState<string | null>(null)

  const {
    origin,
    setOrigin,
    destination,
    setDestination,
    waypoints,
    setWaypoints,
    points,
    polyline,
    result,
    isCalculating,
    error: routeCalcError,
    calculateRoute,
    handleMapClick,
    showMap,
  } = useRoutePlanning()

  useEffect(() => {
    loadMapsLibrary().catch(() => {})
  }, [])

  useEffect(() => {
    setWaypoints((prev) => {
      let changed = false
      const next = prev.map((w) => {
        if (w.tempId) {
          return w
        }
        changed = true
        return {
          ...w,
          tempId:
            globalThis.crypto?.randomUUID?.() ??
            `wp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        }
      })
      return changed ? next : prev
    })
  }, [waypoints, setWaypoints])

  const { vehiclesQuery } = useVehicles({
    page: 1,
    limit: 100,
    statusFilter: '',
    search: '',
    showDeleted: false,
  })

  const { driversQuery } = useDrivers({
    page: 1,
    limit: 100,
    statusFilter: '',
    search: '',
    showDeleted: false,
  })

  const vehicles = vehiclesQuery.data?.data ?? []
  const drivers = driversQuery.data?.data ?? []

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((v) => ({
        value: String(v.id),
        label:
          [v.plate_number, v.brand, v.model].filter(Boolean).join(' · ') ||
          v.vin,
      })),
    [vehicles],
  )

  const driverOptions = useMemo(
    () =>
      drivers.map((d) => ({
        value: String(d.id),
        label: `${d.first_name} ${d.last_name}`,
      })),
    [drivers],
  )

  const waypointDropoffOptions: WaypointOption[] = useMemo(() => {
    return waypoints
      .filter(
        (w) => w.actionType === 'Dropoff' || w.actionType === 'Stopover',
      )
      .map((w, i) => ({
        id: w.tempId ?? `missing-${i}`,
        address: w.address.trim() || `Waypoint ${i + 1}`,
        actionType: w.actionType,
      }))
  }, [waypoints])

  const form = useForm<OrderPlanningFormValues>({
    resolver: zodResolver(orderPlanningFormSchema),
    defaultValues: {
      clientId: 0,
      orderNumber: '',
      deliveryDeadline: '',
      totalPricePln: '',
      cargo: [{ ...EMPTY_CARGO_ITEM, id: generateCargoId() }],
      vehicleId: '',
      driverId: '',
      startTime: '',
    },
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = form

  const cargoWatch = watch('cargo')

  const cargoItemErrors = useMemo(() => {
    const c = errors.cargo
    const items = cargoWatch
    if (!Array.isArray(c) || !items) {
      return {}
    }
    const out: Record<string, CargoItemErrors> = {}
    items.forEach((item, idx) => {
      const ce = c[idx]
      if (!item?.id || !ce || typeof ce !== 'object') {
        return
      }
      const row = ce as Record<string, { message?: string } | undefined>
      out[item.id] = {
        quantity: row.quantity?.message,
        weightPerUnitKg: row.weightPerUnitKg?.message,
        volumePerUnitM3: row.volumePerUnitM3?.message,
      }
    })
    return out
  }, [errors.cargo, cargoWatch])

  const mutation = useMutation({
    mutationFn: planOrderWorkflow,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Planned order created successfully.')
      navigate(`/orders/${data.order.id}`)
    },
  })

  const onSubmit = async (values: OrderPlanningFormValues) => {
    setRouteFlowError(null)
    const built = await buildPlanOrderWorkflowRequestDTO(
      values,
      origin,
      destination,
      waypoints,
      result,
    )
    if (!built.ok) {
      setRouteFlowError(built.error.message)
      return
    }
    mutation.mutate(built.payload, {
      onError: (err) => {
        const msg = applyWorkflowApiErrors(err, setError)
        toast.error(msg)
      },
    })
  }

  const totalWeightKg = useMemo(() => {
    let t = 0
    for (const item of cargoWatch ?? []) {
      const qty = parseInt(String(item.quantity), 10) || 0
      const w = parseFloat(String(item.weightPerUnitKg))
      if (qty > 0 && Number.isFinite(w) && w > 0) {
        t += qty * w
      }
    }
    return t
  }, [cargoWatch])

  return (
    <div className="space-y-8">
      <PageHeader
        title="New order with route planning"
        description="Create an order, plan the route with waypoints, assign cargo and resources, then submit in one workflow."
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
        noValidate
      >
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Client and order
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <ClientAutocompleteInput
                  label="Client"
                  value={selectedClient}
                  onSelect={(client) => {
                    setSelectedClient(client)
                    field.onChange(client?.id ?? 0)
                  }}
                  error={errors.clientId?.message}
                  required
                />
              )}
            />
            <Input
              label="Order number"
              required
              error={errors.orderNumber?.message}
              {...register('orderNumber')}
            />
            <Input
              label="Delivery deadline"
              type="date"
              error={errors.deliveryDeadline?.message}
              {...register('deliveryDeadline')}
            />
            <Input
              label="Total price (PLN)"
              type="number"
              step="0.01"
              min={0}
              error={errors.totalPricePln?.message}
              {...register('totalPricePln')}
            />
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Cargo</h2>
          <CargoSection
            items={cargoWatch ?? []}
            onChange={(items: CargoItemDraft[]) =>
              setValue('cargo', items, { shouldValidate: true })
            }
            waypoints={waypointDropoffOptions}
            itemErrors={cargoItemErrors}
          />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Route and waypoints
          </h2>
          <p className="mb-3 text-sm text-gray-600">
            Add at least one intermediate waypoint. Click &quot;Calculate
            route&quot; before submitting the workflow.
          </p>
          <RoutePlanningForm
            origin={origin}
            setOrigin={setOrigin}
            destination={destination}
            setDestination={setDestination}
            waypoints={waypoints}
            setWaypoints={setWaypoints}
            onCalculate={() => void calculateRoute()}
            result={result}
            isCalculating={isCalculating}
            error={routeCalcError}
          />
          <div className="mt-4">
            {showMap ? (
              <RouteMap
                key="order-plan-map"
                center={{ lat: 52.2297, lng: 21.0122 }}
                zoom={5}
                points={points}
                polyline={polyline}
                onMapClick={handleMapClick}
                className="h-[420px] rounded-md"
              />
            ) : (
              <div className="flex h-[420px] flex-col items-center justify-center gap-2 rounded-md bg-gray-50 text-gray-500">
                <span>
                  Enter load and drop-off addresses, add waypoints, then
                  calculate the route.
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Driver and vehicle
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Vehicle"
              required
              options={vehicleOptions}
              allowEmpty
              emptyLabel="Select vehicle"
              error={errors.vehicleId?.message}
              {...register('vehicleId')}
            />
            <Select
              label="Driver"
              required
              options={driverOptions}
              allowEmpty
              emptyLabel="Select driver"
              error={errors.driverId?.message}
              {...register('driverId')}
            />
            <div className="md:col-span-2">
              <Input
                label="Trip start"
                type="datetime-local"
                required
                error={errors.startTime?.message}
                {...register('startTime')}
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Summary</h2>
          <dl className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
            <div>
              <dt className="font-medium text-gray-500">Client</dt>
              <dd>{selectedClient?.companyName ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Order number</dt>
              <dd>{watch('orderNumber')?.trim() || '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Cargo lines</dt>
              <dd>{cargoWatch?.length ?? 0}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Total cargo weight</dt>
              <dd>
                {Number.isFinite(totalWeightKg)
                  ? `${totalWeightKg.toFixed(1)} kg`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Route distance</dt>
              <dd>
                {result ? `${result.distance_km.toFixed(1)} km` : '—'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">ETA (driving)</dt>
              <dd>
                {result ? `${Math.round(result.duration_minutes)} min` : '—'}
              </dd>
            </div>
          </dl>
        </section>

        {(routeFlowError || mutation.error) && (
          <ErrorMessage
            message={
              routeFlowError ??
              extractApiError(mutation.error) ??
              'Failed to create planned order.'
            }
          />
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={mutation.isPending || isCalculating}
            className="min-w-[10rem]"
          >
            {mutation.isPending ? 'Saving…' : 'Create planned order'}
          </Button>
        </div>
      </form>
    </div>
  )
}
