import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/context/ToastContext'
import type { Client } from '@/hooks/clients/useClients'
import { useDrivers } from '@/hooks/drivers/useDrivers'
import { useRoutePlanning } from '@/hooks/routes/useRoutePlanning'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { EMPTY_CARGO_ITEM } from '@/schemas/cargo'
import type { CargoItemDraft } from '@/schemas/cargo'
import {
  orderPlanningFormSchema,
  type OrderPlanningFormValues,
} from '@/schemas/orderPlanning'
import { planOrderWorkflow } from '@/services/operations'
import type { CargoItemErrors } from '@/utils/cargo'
import { generateCargoId } from '@/utils/cargo'
import { loadMapsLibrary } from '@/utils/googleMapsLoader'
import { buildPlanOrderWorkflowRequestDTO } from '@/utils/orderPlanning'
import { applyWorkflowApiErrors } from '@/utils/orderPlanningWorkflowErrors'

export function useOrderPlanningFlow() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [routeFlowError, setRouteFlowError] = useState<string | null>(null)

  const routePlanning = useRoutePlanning()
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
  } = routePlanning

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

  const waypointDropoffOptions = useMemo(() => {
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
    getValues,
    formState: { errors },
  } = form

  const cargoWatch = watch('cargo')

  useEffect(() => {
    const validTempIds = new Set(
      waypoints
        .map((w) => w.tempId?.trim())
        .filter((id): id is string => Boolean(id)),
    )
    const cargo = getValues('cargo')
    let changed = false
    const next = cargo.map((item) => {
      const tid = item.destinationWaypointTempId?.trim()
      if (tid && !validTempIds.has(tid)) {
        changed = true
        return { ...item, destinationWaypointTempId: null }
      }
      return item
    })
    if (changed) {
      setValue('cargo', next, { shouldValidate: true })
    }
  }, [waypoints, getValues, setValue])

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
  const { mutate } = mutation

  const onValidSubmit = useCallback(
    async (values: OrderPlanningFormValues) => {
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
      mutate(built.payload, {
        onError: (err) => {
          const msg = applyWorkflowApiErrors(err, setError)
          toast.error(msg)
        },
      })
    },
    [origin, destination, waypoints, result, mutate, setError],
  )

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

  const setCargoItems = useCallback(
    (items: CargoItemDraft[]) => {
      setValue('cargo', items, { shouldValidate: true })
    },
    [setValue],
  )

  return {
    register,
    handleSubmit: handleSubmit(onValidSubmit),
    control,
    watch,
    errors,
    selectedClient,
    setSelectedClient,
    routePlanning: {
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
    },
    vehicleOptions,
    driverOptions,
    waypointDropoffOptions,
    cargoItemErrors,
    cargoWatch: cargoWatch ?? [],
    setCargoItems,
    mutation: {
      isPending: mutation.isPending,
      error: mutation.error,
    },
    routeFlowError,
    totalWeightKg,
    isCalculating,
  }
}
