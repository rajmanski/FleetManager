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
import {
  applyWorkflowApiErrors,
  parseWorkflowValidationError,
} from '@/utils/orderPlanningWorkflowErrors'

export type OrderPlanningStepId =
  | 'client_order'
  | 'cargo'
  | 'route'
  | 'resources'
  | 'summary'

export const ORDER_PLANNING_STEPS: Array<{
  id: OrderPlanningStepId
  title: string
}> = [
  { id: 'client_order', title: 'Client and order' },
  { id: 'cargo', title: 'Cargo' },
  { id: 'route', title: 'Route' },
  { id: 'resources', title: 'Resources' },
  { id: 'summary', title: 'Summary' },
]

type SubmissionState = 'idle' | 'partial_validation' | 'loading' | 'retry'

type SectionErrors = Record<OrderPlanningStepId, string[]>

const EMPTY_SECTION_ERRORS: SectionErrors = {
  client_order: [],
  cargo: [],
  route: [],
  resources: [],
  summary: [],
}

const STEP_FIELDS: Record<
  Exclude<OrderPlanningStepId, 'route' | 'summary'>,
  Array<keyof OrderPlanningFormValues>
> = {
  client_order: ['clientId', 'orderNumber', 'deliveryDeadline', 'totalPricePln'],
  cargo: ['cargo'],
  resources: ['vehicleId', 'driverId', 'startTime'],
}

function fieldBelongsToStep(field: string, step: OrderPlanningStepId): boolean {
  switch (step) {
    case 'client_order':
      return field.startsWith('order.')
    case 'cargo':
      return field.startsWith('cargo[')
    case 'route':
      return field.startsWith('route.')
    case 'resources':
      return field.startsWith('trip.')
    case 'summary':
      return false
  }
}

function globalErrorStep(code: string): OrderPlanningStepId | null {
  if (code.includes('WAYPOINT') || code.includes('SEQUENCE')) return 'route'
  if (code.includes('CARGO')) return 'cargo'
  return null
}

export function useOrderPlanningFlow() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [routeFlowError, setRouteFlowError] = useState<string | null>(null)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle')
  const [backendSectionErrors, setBackendSectionErrors] =
    useState<SectionErrors>(EMPTY_SECTION_ERRORS)

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
    trigger,
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
      setSubmissionState('idle')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Planned order created successfully.')
      navigate(`/orders/${data.order.id}`)
    },
  })
  const { mutate } = mutation

  const onValidSubmit = useCallback(
    async (values: OrderPlanningFormValues) => {
      setRouteFlowError(null)
      setBackendSectionErrors(EMPTY_SECTION_ERRORS)
      setSubmissionState('loading')
      const built = await buildPlanOrderWorkflowRequestDTO(
        values,
        origin,
        destination,
        waypoints,
        result,
      )
      if (!built.ok) {
        setRouteFlowError(built.error.message)
        setSubmissionState('partial_validation')
        setActiveStepIndex(2)
        return
      }
      mutate(built.payload, {
        onError: (err) => {
          const parsed = parseWorkflowValidationError(err)
          if (parsed) {
            const sectionErrors: SectionErrors = {
              client_order: [],
              cargo: [],
              route: [],
              resources: [],
              summary: [],
            }
            for (const fe of parsed.fieldErrors) {
              for (const step of ORDER_PLANNING_STEPS) {
                if (fieldBelongsToStep(fe.field, step.id)) {
                  sectionErrors[step.id].push(fe.message)
                }
              }
            }
            for (const ge of parsed.globalErrors) {
              const step = globalErrorStep(ge.code)
              if (step) {
                sectionErrors[step].push(ge.message)
              } else {
                sectionErrors.summary.push(ge.message)
              }
            }
            setBackendSectionErrors(sectionErrors)
          }
          const msg = applyWorkflowApiErrors(err, setError)
          toast.error(msg)
          setSubmissionState('retry')
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

  const steps = ORDER_PLANNING_STEPS
  const activeStep = steps[activeStepIndex] ?? steps[0]

  const criticalIssues = useMemo(() => {
    const issues: string[] = []
    if (!origin.address.trim() || !destination.address.trim()) {
      issues.push('Load and drop-off addresses are required.')
    }
    if (waypoints.length < 1) {
      issues.push('At least one intermediate waypoint is required.')
    }
    if (!result) {
      issues.push('Route must be calculated before submit.')
    }
    return issues
  }, [origin.address, destination.address, waypoints.length, result])

  const canSubmit =
    !mutation.isPending &&
    !isCalculating &&
    criticalIssues.length === 0 &&
    activeStep.id === 'summary'

  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= ORDER_PLANNING_STEPS.length) return
    setActiveStepIndex(index)
  }, [])

  const nextStep = useCallback(async () => {
    const current = ORDER_PLANNING_STEPS[activeStepIndex]
    if (!current) return false
    if (current.id === 'summary') return true

    let valid = true
    if (current.id === 'route') {
      valid = criticalIssues.length === 0
    } else {
      valid = await trigger(STEP_FIELDS[current.id], { shouldFocus: true })
    }
    if (!valid) {
      setSubmissionState('partial_validation')
      return false
    }
    goToStep(activeStepIndex + 1)
    return true
  }, [activeStepIndex, criticalIssues.length, goToStep, trigger])

  const prevStep = useCallback(() => {
    goToStep(activeStepIndex - 1)
  }, [activeStepIndex, goToStep])

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
    steps,
    activeStep,
    activeStepIndex,
    goToStep,
    nextStep,
    prevStep,
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
    submissionState,
    backendSectionErrors,
    routeFlowError,
    criticalIssues,
    canSubmit,
    totalWeightKg,
    isCalculating,
  }
}
