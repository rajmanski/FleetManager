import {
  flowReducer,
  INITIAL_FLOW_STATE,
} from './orderPlanningFlowReducer'
import {
  computeCriticalIssues,
  computeFlowErrors,
  globalErrorStep,
  mapWorkflowErrorsToSections,
} from './orderPlanningFlowErrors'
import { applyWorkflowApiErrors, parseWorkflowValidationError } from '@/utils/orderPlanningWorkflowErrors'
import { EMPTY_SECTION_ERRORS } from './orderPlanningFlowTypes'
import { AxiosError } from 'axios'

// --- flowReducer ---

describe('flowReducer', () => {
  it('GO_TO_STEP changes activeStepIndex', () => {
    const next = flowReducer(INITIAL_FLOW_STATE, { type: 'GO_TO_STEP', index: 3 })
    expect(next.activeStepIndex).toBe(3)
  })

  it('STEP_VALIDATION_FAILED sets submissionState to partial_validation', () => {
    const next = flowReducer(INITIAL_FLOW_STATE, { type: 'STEP_VALIDATION_FAILED' })
    expect(next.submissionState).toBe('partial_validation')
  })

  it('SUBMIT_START clears errors and sets loading', () => {
    const withErrors = {
      ...INITIAL_FLOW_STATE,
      routeFlowError: 'some error',
      submissionState: 'retry' as const,
    }
    const next = flowReducer(withErrors, { type: 'SUBMIT_START' })
    expect(next.submissionState).toBe('loading')
    expect(next.routeFlowError).toBeNull()
    expect(next.backendSectionErrors).toEqual(EMPTY_SECTION_ERRORS)
  })

  it('BUILD_FAILED jumps to route step (index 1) with partial_validation', () => {
    const next = flowReducer(INITIAL_FLOW_STATE, { type: 'BUILD_FAILED', routeError: 'No route' })
    expect(next.submissionState).toBe('partial_validation')
    expect(next.routeFlowError).toBe('No route')
    expect(next.lastErrorSource).toBe('local')
    expect(next.activeStepIndex).toBe(1)
  })

  it('BACKEND_FAILED sets retry state and jumps to first error step', () => {
    const backendErrors = { ...EMPTY_SECTION_ERRORS, resources: ['ADR required'] }
    const next = flowReducer(INITIAL_FLOW_STATE, {
      type: 'BACKEND_FAILED',
      backendErrors,
      routeError: 'Submission failed',
      stepIndex: 3,
    })
    expect(next.submissionState).toBe('retry')
    expect(next.backendSectionErrors.resources).toContain('ADR required')
    expect(next.routeFlowError).toBe('Submission failed')
    expect(next.lastErrorSource).toBe('backend')
    expect(next.activeStepIndex).toBe(3)
  })

  it('BACKEND_FAILED keeps current step when stepIndex is -1', () => {
    const state = { ...INITIAL_FLOW_STATE, activeStepIndex: 2 }
    const next = flowReducer(state, {
      type: 'BACKEND_FAILED',
      backendErrors: EMPTY_SECTION_ERRORS,
      routeError: null,
      stepIndex: -1,
    })
    expect(next.activeStepIndex).toBe(2)
  })

  it('RESET_ERRORS returns to idle with cleared errors', () => {
    const errState = {
      ...INITIAL_FLOW_STATE,
      submissionState: 'retry' as const,
      routeFlowError: 'some error',
      backendSectionErrors: { ...EMPTY_SECTION_ERRORS, route: ['bad route'] },
      lastErrorSource: 'backend' as const,
    }
    const next = flowReducer(errState, { type: 'RESET_ERRORS' })
    expect(next.submissionState).toBe('idle')
    expect(next.routeFlowError).toBeNull()
    expect(next.backendSectionErrors).toEqual(EMPTY_SECTION_ERRORS)
    expect(next.lastErrorSource).toBe('none')
  })

  it('SUBMIT_SUCCESS sets submissionState to idle', () => {
    const loading = { ...INITIAL_FLOW_STATE, submissionState: 'loading' as const }
    const next = flowReducer(loading, { type: 'SUBMIT_SUCCESS' })
    expect(next.submissionState).toBe('idle')
  })
})

// --- Pure error helpers ---

describe('mapWorkflowErrorsToSections', () => {
  it('maps field and global errors to proper sections', () => {
    const sections = mapWorkflowErrorsToSections(
      {
        fieldErrors: [
          { field: 'order.order_number', message: 'Order number required' },
          { field: 'trip.driver_id', message: 'ADR is required' },
        ],
        globalErrors: [{ code: 'WAYPOINTS_LIMIT', message: 'Max 10 waypoints' }],
      },
      [
        { id: 'client_order' }, { id: 'route' }, { id: 'cargo' },
        { id: 'resources' }, { id: 'summary' },
      ],
    )

    expect(sections.client_order).toContain('Order number required')
    expect(sections.resources).toContain('ADR is required')
    expect(sections.route).toContain('Max 10 waypoints')
  })

  it('classifies unknown global code as summary', () => {
    expect(globalErrorStep('SOME_UNKNOWN_CODE')).toBeNull()
  })
})

describe('computeFlowErrors', () => {
  it('returns unique flow errors and includes critical issues only when non-idle', () => {
    const errors = computeFlowErrors({
      submissionState: 'retry',
      criticalIssues: ['Route must be calculated before submit.'],
      backendSectionErrors: {
        client_order: [],
        cargo: [],
        route: ['Route must be calculated before submit.', 'Waypoint sequence is invalid'],
        resources: [],
        summary: [],
      },
      activeStepId: 'route',
      routeFlowError: 'Waypoint sequence is invalid',
    })

    expect(errors).toEqual([
      'Route must be calculated before submit.',
      'Waypoint sequence is invalid',
    ])
  })

  it('does not include critical issues when state is idle', () => {
    const errors = computeFlowErrors({
      submissionState: 'idle',
      criticalIssues: ['Route must be calculated before submit.'],
      backendSectionErrors: EMPTY_SECTION_ERRORS,
      activeStepId: 'route',
      routeFlowError: null,
    })

    expect(errors).toHaveLength(0)
  })
})

describe('computeCriticalIssues', () => {
  it('reports missing addresses and missing route result', () => {
    expect(computeCriticalIssues('', 'Krakow', false)).toEqual([
      'Load and drop-off addresses are required.',
      'Route must be calculated before submit.',
    ])
  })

  it('returns empty array when all conditions met', () => {
    expect(computeCriticalIssues('Warsaw', 'Krakow', true)).toHaveLength(0)
  })
})

describe('applyWorkflowApiErrors', () => {
  it('falls back to generic error message', () => {
    const msg = applyWorkflowApiErrors(new Error('unexpected crash'), vi.fn())
    expect(msg).toContain('unexpected crash')
  })
})

describe('parseWorkflowValidationError + section mapping integration', () => {
  it('parses axios workflow error and maps to sections', () => {
    const axiosErr = new AxiosError('validation failed')
    ;(axiosErr as unknown as { response: unknown }).response = {
      data: {
        error: {
          message: 'workflow validation failed',
          field_errors: [
            { field: 'order.order_number', code: 'REQUIRED', message: 'Order number is required' },
          ],
          global_errors: [
            { field: '', code: 'WAYPOINTS_LIMIT', message: 'maximum number of waypoints is 10' },
          ],
        },
      },
    }

    const parsed = parseWorkflowValidationError(axiosErr)
    expect(parsed).not.toBeNull()

    const sections = mapWorkflowErrorsToSections(parsed!, [
      { id: 'client_order' }, { id: 'route' }, { id: 'cargo' },
      { id: 'resources' }, { id: 'summary' },
    ])

    const flowErrors = computeFlowErrors({
      submissionState: 'retry',
      criticalIssues: [],
      backendSectionErrors: sections,
      activeStepId: 'route',
      routeFlowError: null,
    })

    expect(sections.client_order).toContain('Order number is required')
    expect(sections.route).toContain('maximum number of waypoints is 10')
    expect(flowErrors).toContain('maximum number of waypoints is 10')
  })
})
