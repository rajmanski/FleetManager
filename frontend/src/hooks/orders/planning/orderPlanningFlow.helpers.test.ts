import {
  computeCriticalIssues,
  computeFlowErrors,
  globalErrorStep,
  mapWorkflowErrorsToSections,
} from './orderPlanningFlow.helpers'
import { applyWorkflowApiErrors, parseWorkflowValidationError } from '@/utils/orderPlanningWorkflowErrors'
import { AxiosError } from 'axios'

describe('orderPlanningFlow.helpers', () => {
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
        { id: 'client_order' },
        { id: 'cargo' },
        { id: 'route' },
        { id: 'resources' },
        { id: 'summary' },
      ],
    )

    expect(sections.client_order).toContain('Order number required')
    expect(sections.resources).toContain('ADR is required')
    expect(sections.route).toContain('Max 10 waypoints')
  })

  it('classifies unknown global code as summary', () => {
    expect(globalErrorStep('SOME_UNKNOWN_CODE')).toBeNull()
  })

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

  it('detects critical issues for missing addresses and route result', () => {
    expect(computeCriticalIssues('', 'Krakow', false)).toEqual([
      'Load and drop-off addresses are required.',
      'Route must be calculated before submit.',
    ])
  })

  it('integrates backend validation parse with section mapping and flow errors', () => {
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
      { id: 'client_order' },
      { id: 'cargo' },
      { id: 'route' },
      { id: 'resources' },
      { id: 'summary' },
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

  it('falls back to generic api error message shape', () => {
    const msg = applyWorkflowApiErrors(new Error('unexpected crash'), vi.fn())
    expect(msg).toContain('unexpected crash')
  })
})
