import type { OrderPlanningStepId, SectionErrors, SubmissionState } from './orderPlanningFlowTypes'

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

export function fieldBelongsToStep(field: string, step: OrderPlanningStepId): boolean {
  switch (step) {
    case 'client_order':
      return field.startsWith('order.')
    case 'cargo':
      return field.startsWith('cargo.')
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
