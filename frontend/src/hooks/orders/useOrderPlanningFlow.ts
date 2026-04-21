import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CargoItemDraft } from '@/schemas/cargo'
import type { Client } from '@/hooks/clients/useClients'
import { useDrivers } from '@/hooks/drivers/useDrivers'
import { useRoutePlanning } from '@/hooks/routes/useRoutePlanning'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { EMPTY_CARGO_ITEM } from '@/schemas/cargo'
import {
  orderPlanningFormSchema,
  type OrderPlanningFormValues,
} from '@/schemas/orderPlanning'
import { generateCargoId } from '@/utils/cargo'
import {
  EMPTY_SECTION_ERRORS,
  computeCriticalIssues,
  computeFlowErrors,
  computeTotalWeightKg,
  hasHazardousCargo,
  buildWaypointDropoffOptions,
  mapCargoItemErrors,
  type OrderPlanningStepId,
  type SectionErrors,
  type SubmissionState,
} from './planning/orderPlanningFlow.helpers'
import { useOrderPlanningRouteEffects } from './planning/useOrderPlanningRouteEffects'
import { useOrderPlanningResourceFilters } from './planning/useOrderPlanningResourceFilters'
import { useOrderPlanningStepNavigation } from './planning/useOrderPlanningStepNavigation'
import { useOrderPlanningSubmission } from './planning/useOrderPlanningSubmission'

export type { OrderPlanningStepId }

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


export function useOrderPlanningFlow() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [routeFlowError, setRouteFlowError] = useState<string | null>(null)
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle')
  const [backendSectionErrors, setBackendSectionErrors] =
    useState<SectionErrors>(EMPTY_SECTION_ERRORS)
  const [lastErrorSource, setLastErrorSource] = useState<'none' | 'backend' | 'local'>('none')
  const steps = ORDER_PLANNING_STEPS

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

  const waypointDropoffOptions = useMemo(
    () => buildWaypointDropoffOptions(waypoints),
    [waypoints],
  )

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
  const startTimeWatch = watch('startTime')
  const selectedVehicleId = watch('vehicleId')
  const selectedDriverId = watch('driverId')
  const totalWeightKg = useMemo(
    () => computeTotalWeightKg(cargoWatch ?? []),
    [cargoWatch],
  )
  const hasHazardous = useMemo(
    () => hasHazardousCargo(cargoWatch ?? []),
    [cargoWatch],
  )

  const {
    vehicleOptions,
    driverOptions,
    isCheckingAvailability,
  } = useOrderPlanningResourceFilters({
    vehicles,
    drivers,
    startTime: startTimeWatch,
    totalWeightKg,
    hasHazardousCargo: hasHazardous,
    selectedVehicleId,
    selectedDriverId,
    setVehicleId: (value) => setValue('vehicleId', value, { shouldValidate: true }),
    setDriverId: (value) => setValue('driverId', value, { shouldValidate: true }),
  })

  const criticalIssues = useMemo(
    () => computeCriticalIssues(origin.address, destination.address, Boolean(result)),
    [origin.address, destination.address, result],
  )

  useOrderPlanningRouteEffects({
    waypoints,
    setWaypoints,
    getValues,
    setValue,
  })

  const cargoItemErrors = useMemo(() => {
    return mapCargoItemErrors(errors.cargo, cargoWatch)
  }, [errors.cargo, cargoWatch])

  const {
    activeStepIndex,
    activeStep,
    setActiveStepIndex,
    goToStep,
    nextStep,
    prevStep,
  } = useOrderPlanningStepNavigation({
    steps,
    criticalIssuesCount: criticalIssues.length,
    trigger,
    setSubmissionState,
  })

  const { mutation, onValidSubmit } = useOrderPlanningSubmission({
    origin,
    destination,
    waypoints,
    result,
    steps,
    setError,
    setRouteFlowError,
    setBackendSectionErrors,
    setSubmissionState,
    setLastErrorSource,
    setActiveStepIndex,
  })

  const setCargoItems = useCallback(
    (items: CargoItemDraft[]) => {
      setValue('cargo', items, { shouldValidate: true })
    },
    [setValue],
  )

  useEffect(() => {
    if (lastErrorSource === 'none') {
      return
    }
    if (submissionState === 'loading') {
      return
    }

    setRouteFlowError(null)
    setBackendSectionErrors(EMPTY_SECTION_ERRORS)
    setSubmissionState('idle')
    setLastErrorSource('none')
  }, [
    lastErrorSource,
    submissionState,
    selectedClient?.id,
    startTimeWatch,
    selectedVehicleId,
    selectedDriverId,
    origin.address,
    destination.address,
    waypoints,
    cargoWatch,
  ])

  const flowErrors = useMemo(
    () =>
      computeFlowErrors({
        submissionState,
        criticalIssues,
        backendSectionErrors,
        activeStepId: activeStep.id,
        routeFlowError,
      }),
    [submissionState, criticalIssues, backendSectionErrors, activeStep.id, routeFlowError],
  )

  const canSubmit =
    !mutation.isPending &&
    !isCalculating &&
    criticalIssues.length === 0 &&
    activeStep.id === 'summary'

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
    flowErrors,
    canSubmit,
    totalWeightKg,
    isCalculating,
    vehicleAvailabilityPending: isCheckingAvailability,
  }
}
