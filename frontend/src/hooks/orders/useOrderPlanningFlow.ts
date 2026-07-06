import { useEffect, useMemo, useReducer, useState } from 'react'
import type { Client } from '@/hooks/clients/useClients'
import { useDrivers } from '@/hooks/drivers/useDrivers'
import { useRoutePlanning } from '@/hooks/routes/useRoutePlanning'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { type OrderPlanningStepId, EMPTY_SECTION_ERRORS } from './planning/orderPlanningFlowTypes'
import {
  computeTotalWeightKg,
  hasHazardousCargo,
  buildWaypointDropoffOptions,
  mapCargoItemErrors,
} from './planning/orderPlanningFlowData'
import {
  computeCriticalIssues,
  computeFlowErrors,
} from './planning/orderPlanningFlowErrors'
import { useOrderPlanningFormState } from './planning/useOrderPlanningFormState'
import { useOrderPlanningRouteEffects } from './planning/useOrderPlanningRouteEffects'
import { useOrderPlanningResourceFilters } from './planning/useOrderPlanningResourceFilters'
import { useOrderPlanningStepNavigation } from './planning/useOrderPlanningStepNavigation'
import { useOrderPlanningSubmission } from './planning/useOrderPlanningSubmission'
import {
  flowReducer,
  INITIAL_FLOW_STATE,
} from './planning/orderPlanningFlowReducer'

export type { OrderPlanningStepId }

export const ORDER_PLANNING_STEPS: Array<{ id: OrderPlanningStepId; title: string }> = [
  { id: 'client_order', title: 'Client and order' },
  { id: 'route', title: 'Route' },
  { id: 'cargo', title: 'Cargo' },
  { id: 'resources', title: 'Resources' },
  { id: 'summary', title: 'Summary' },
]

export function useOrderPlanningFlow() {
  const [flowState, dispatch] = useReducer(flowReducer, INITIAL_FLOW_STATE)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const form = useOrderPlanningFormState()
  const routePlanning = useRoutePlanning()

  const { vehiclesQuery } = useVehicles({ page: 1, limit: 100, statusFilter: '', search: '', showDeleted: false })
  const { driversQuery } = useDrivers({ page: 1, limit: 100, statusFilter: '', search: '', showDeleted: false })
  const vehicles = vehiclesQuery.data?.data ?? []
  const drivers = driversQuery.data?.data ?? []

  const totalWeightKg = useMemo(() => computeTotalWeightKg(form.cargoWatch), [form.cargoWatch])
  const hasHazardous = useMemo(() => hasHazardousCargo(form.cargoWatch), [form.cargoWatch])

  const resources = useOrderPlanningResourceFilters({
    vehicles,
    drivers,
    startTime: form.startTimeWatch,
    totalWeightKg,
    hasHazardousCargo: hasHazardous,
    selectedVehicleId: form.selectedVehicleId,
    selectedDriverId: form.selectedDriverId,
    setVehicleId: (v) => form.setValue('vehicleId', v, { shouldValidate: true }),
    setDriverId: (v) => form.setValue('driverId', v, { shouldValidate: true }),
  })

  useOrderPlanningRouteEffects({
    waypoints: routePlanning.waypoints,
    setWaypoints: routePlanning.setWaypoints,
    getValues: form.getValues,
    setValue: form.setValue,
  })

  const steps = ORDER_PLANNING_STEPS
  const activeStep = steps[flowState.activeStepIndex] ?? steps[0]

  const criticalIssues = useMemo(
    () => computeCriticalIssues(routePlanning.origin.address, routePlanning.destination.address, Boolean(routePlanning.result)),
    [routePlanning.origin.address, routePlanning.destination.address, routePlanning.result],
  )

  const navigation = useOrderPlanningStepNavigation({
    steps,
    activeStepIndex: flowState.activeStepIndex,
    criticalIssuesCount: criticalIssues.length,
    trigger: form.trigger,
    dispatch,
  })

  const submission = useOrderPlanningSubmission({
    origin: routePlanning.origin,
    destination: routePlanning.destination,
    waypoints: routePlanning.waypoints,
    result: routePlanning.result,
    steps,
    setError: form.setError,
    dispatch,
  })

  useEffect(() => {
    if (flowState.lastErrorSource === 'none' || flowState.submissionState === 'loading') return
    dispatch({ type: 'RESET_ERRORS' })
  }, [
    flowState.lastErrorSource,
    flowState.submissionState,
    selectedClient?.id,
    form.startTimeWatch,
    form.selectedVehicleId,
    form.selectedDriverId,
    routePlanning.origin.address,
    routePlanning.destination.address,
    routePlanning.waypoints,
    form.cargoWatch,
  ])

  const waypointDropoffOptions = useMemo(
    () => buildWaypointDropoffOptions(routePlanning.waypoints),
    [routePlanning.waypoints],
  )

  const cargoItemErrors = useMemo(
    () => mapCargoItemErrors(form.errors.cargo, form.cargoWatch),
    [form.errors.cargo, form.cargoWatch],
  )

  const flowErrors = useMemo(
    () =>
      computeFlowErrors({
        submissionState: flowState.submissionState,
        criticalIssues,
        backendSectionErrors: flowState.backendSectionErrors,
        activeStepId: activeStep.id,
        routeFlowError: flowState.routeFlowError,
      }),
    [flowState.submissionState, criticalIssues, flowState.backendSectionErrors, activeStep.id, flowState.routeFlowError],
  )

  const canSubmit =
    !submission.mutation.isPending &&
    !routePlanning.isCalculating &&
    criticalIssues.length === 0 &&
    activeStep.id === 'summary'

  return {
    form: {
      register: form.register,
      control: form.control,
      errors: form.errors,
      handleSubmit: form.handleSubmit(submission.onValidSubmit),
      watch: form.watch,
    },
    client: {
      selected: selectedClient,
      onChange: setSelectedClient,
    },
    route: routePlanning,
    steps: {
      list: steps,
      active: activeStep,
      activeIndex: flowState.activeStepIndex,
      goTo: navigation.goToStep,
      next: navigation.nextStep,
      prev: navigation.prevStep,
    },
    cargo: {
      items: form.cargoWatch,
      setItems: form.setCargoItems,
      itemErrors: cargoItemErrors,
      waypointOptions: waypointDropoffOptions,
      totalWeightKg,
    },
    resources: {
      vehicleOptions: resources.vehicleOptions,
      driverOptions: resources.driverOptions,
      isPending: resources.isPending,
    },
    submission: {
      state: flowState.submissionState,
      flowErrors,
      canSubmit,
      backendSectionErrors: flowState.backendSectionErrors,
      isPending: submission.mutation.isPending,
    },
  }
}

export type OrderPlanningFlowReturn = ReturnType<typeof useOrderPlanningFlow>

export { EMPTY_SECTION_ERRORS }
