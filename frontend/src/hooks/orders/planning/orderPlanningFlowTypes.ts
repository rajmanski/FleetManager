import type { OrderPlanningFormValues } from '@/schemas/orderPlanning'

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
