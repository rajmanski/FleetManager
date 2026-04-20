import { isAxiosError } from 'axios'
import type { Path } from 'react-hook-form'
import type { OrderPlanningFormValues } from '@/schemas/orderPlanning'
import { extractApiError } from '@/utils/api'
import type { WorkflowValidationErrorBody } from '@/types/operations'

export type WorkflowValidationIssue = {
  field: string
  code: string
  message: string
}

export type ParsedWorkflowValidationError = {
  message: string
  fieldErrors: WorkflowValidationIssue[]
  globalErrors: WorkflowValidationIssue[]
}

export function parseWorkflowValidationError(
  err: unknown,
): ParsedWorkflowValidationError | null {
  if (!isAxiosError(err)) {
    return null
  }
  const body = err.response?.data as
    | { error?: string | WorkflowValidationErrorBody }
    | undefined
  const inner = body?.error
  if (typeof inner !== 'object') {
    return null
  }
  return {
    message: inner.message ?? 'Validation failed.',
    fieldErrors: inner.field_errors ?? [],
    globalErrors: inner.global_errors ?? [],
  }
}

export function applyWorkflowApiErrors(
  err: unknown,
  setError: (
    name: Path<OrderPlanningFormValues>,
    error: { message: string },
  ) => void,
): string {
  const parsed = parseWorkflowValidationError(err)
  if (parsed && parsed.fieldErrors.length > 0) {
    for (const fe of parsed.fieldErrors) {
      const p = mapWorkflowFieldToFormPath(fe.field)
      if (p) {
        setError(p, { message: fe.message })
      }
    }
    return parsed.message
  }
  return extractApiError(err) ?? 'Request failed.'
}

export function mapWorkflowFieldToFormPath(
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
