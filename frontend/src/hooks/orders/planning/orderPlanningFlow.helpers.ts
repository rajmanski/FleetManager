import type { CargoItemDraft } from '@/schemas/cargo'
import type { OrderPlanningFormValues } from '@/schemas/orderPlanning'
import type { Driver } from '@/hooks/drivers/useDrivers'
import type { CargoItemErrors } from '@/utils/cargo'

export type OrderPlanningStepId =
  | 'client_order'
  | 'cargo'
  | 'route'
  | 'resources'
  | 'summary'

export type SectionErrors = Record<OrderPlanningStepId, string[]>
export type SubmissionState = 'idle' | 'partial_validation' | 'loading' | 'retry'

export const EMPTY_SECTION_ERRORS: SectionErrors = {
  client_order: [],
  cargo: [],
  route: [],
  resources: [],
  summary: [],
}

export const STEP_FIELDS: Record<
  Exclude<OrderPlanningStepId, 'route' | 'summary'>,
  Array<keyof OrderPlanningFormValues>
> = {
  client_order: ['clientId', 'orderNumber', 'deliveryDeadline', 'totalPricePln'],
  cargo: ['cargo'],
  resources: ['vehicleId', 'driverId', 'startTime'],
}

export function fieldBelongsToStep(field: string, step: OrderPlanningStepId): boolean {
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

export function globalErrorStep(code: string): OrderPlanningStepId | null {
  if (code.includes('WAYPOINT') || code.includes('SEQUENCE')) return 'route'
  if (code.includes('CARGO')) return 'cargo'
  return null
}

export function isDriverAdrValid(driver?: Driver): boolean {
  if (!driver?.adr_certified) {
    return false
  }
  if (!driver.adr_expiry_date) {
    return true
  }
  const expiry = new Date(driver.adr_expiry_date)
  if (Number.isNaN(expiry.getTime())) {
    return false
  }
  return expiry >= new Date()
}

export function computeTotalWeightKg(items: CargoItemDraft[]): number {
  let total = 0
  for (const item of items) {
    const qty = parseInt(String(item.quantity), 10) || 0
    const weight = parseFloat(String(item.weightPerUnitKg))
    if (qty > 0 && Number.isFinite(weight) && weight > 0) {
      total += qty * weight
    }
  }
  return total
}

export function hasHazardousCargo(items: CargoItemDraft[]): boolean {
  return items.some((item) => item.cargoType === 'Hazardous')
}

type FieldErrorLike = {
  field: string
  message: string
}

type GlobalErrorLike = {
  code: string
  message: string
}

type ParsedWorkflowErrorLike = {
  fieldErrors: FieldErrorLike[]
  globalErrors: GlobalErrorLike[]
}

export function mapWorkflowErrorsToSections(
  parsed: ParsedWorkflowErrorLike,
  steps: Array<{ id: OrderPlanningStepId }>,
): SectionErrors {
  const sectionErrors: SectionErrors = {
    client_order: [],
    cargo: [],
    route: [],
    resources: [],
    summary: [],
  }

  for (const fe of parsed.fieldErrors) {
    for (const step of steps) {
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

  return sectionErrors
}

export function findFirstStepWithErrors(
  sectionErrors: SectionErrors,
  steps: Array<{ id: OrderPlanningStepId }>,
): number {
  return steps.findIndex((step) => sectionErrors[step.id].length > 0)
}

export function mapCargoItemErrors(
  cargoErrors: unknown,
  cargoItems?: CargoItemDraft[],
): Record<string, CargoItemErrors> {
  if (!Array.isArray(cargoErrors) || !cargoItems) {
    return {}
  }

  const out: Record<string, CargoItemErrors> = {}
  cargoItems.forEach((item, idx) => {
    const ce = cargoErrors[idx]
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
}

export function buildWaypointDropoffOptions(
  waypoints: Array<{ tempId?: string; address: string; actionType: string }>,
) {
  return waypoints
    .filter((waypoint) => {
      return waypoint.actionType === 'Dropoff' || waypoint.actionType === 'Stopover'
    })
    .map((waypoint, index) => ({
      id: waypoint.tempId ?? `missing-${index}`,
      address: waypoint.address.trim() || `Waypoint ${index + 1}`,
      actionType: waypoint.actionType,
    }))
}

export function computeCriticalIssues(
  originAddress: string,
  destinationAddress: string,
  hasRouteResult: boolean,
): string[] {
  const issues: string[] = []
  if (!originAddress.trim() || !destinationAddress.trim()) {
    issues.push('Load and drop-off addresses are required.')
  }
  if (!hasRouteResult) {
    issues.push('Route must be calculated before submit.')
  }
  return issues
}

export function computeFlowErrors(args: {
  submissionState: SubmissionState
  criticalIssues: string[]
  backendSectionErrors: SectionErrors
  activeStepId: OrderPlanningStepId
  routeFlowError: string | null
}): string[] {
  const errorsList: string[] = []
  if (args.submissionState !== 'idle') {
    errorsList.push(...args.criticalIssues)
  }
  if (args.backendSectionErrors[args.activeStepId].length > 0) {
    errorsList.push(...args.backendSectionErrors[args.activeStepId])
  }
  if (args.routeFlowError) {
    errorsList.push(args.routeFlowError)
  }
  return Array.from(new Set(errorsList))
}

