import { act, renderHook } from '@testing-library/react'
import { useOrderPlanningSubmission } from './useOrderPlanningSubmission'
import type { FlowAction } from './orderPlanningFlowReducer'
import type { OrderPlanningStepId } from './orderPlanningFlowTypes'
import type { WaypointState } from '@/types/routes'

const navigateMock = vi.fn()
const mutateMock = vi.fn()
const invalidateQueriesMock = vi.fn()
const toastSuccessMock = vi.fn()
const parseWorkflowValidationErrorMock = vi.fn()
const applyWorkflowApiErrorsMock = vi.fn()
const buildPlanOrderWorkflowRequestDTOMock = vi.fn()
const mutationOptionsRef: { onSuccess?: (data: { order: { id: number } }) => void } = {}

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ success: toastSuccessMock }),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
    useMutation: (options: { onSuccess?: (data: { order: { id: number } }) => void }) => {
      mutationOptionsRef.onSuccess = options.onSuccess
      return { isPending: false, error: null, mutate: mutateMock }
    },
  }
})

vi.mock('@/utils/orderPlanningWorkflowErrors', () => ({
  parseWorkflowValidationError: (error: unknown) => parseWorkflowValidationErrorMock(error),
  applyWorkflowApiErrors: (error: unknown, setError: unknown) =>
    applyWorkflowApiErrorsMock(error, setError),
}))

vi.mock('@/utils/orderPlanning', () => ({
  buildPlanOrderWorkflowRequestDTO: (...args: unknown[]) =>
    buildPlanOrderWorkflowRequestDTOMock(...args),
}))

function makeDispatch() {
  const dispatched: FlowAction[] = []
  const dispatch = vi.fn((action: FlowAction) => dispatched.push(action))
  return { dispatch, dispatched }
}

const baseSteps: Array<{ id: OrderPlanningStepId }> = [
  { id: 'client_order' },
  { id: 'route' },
  { id: 'cargo' },
  { id: 'resources' },
  { id: 'summary' },
]

const baseArgs = {
  origin: { address: '', lat: undefined, lng: undefined },
  destination: { address: '', lat: undefined, lng: undefined },
  waypoints: [] as WaypointState[],
  result: null,
  steps: baseSteps,
  setError: vi.fn(),
}

describe('useOrderPlanningSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dispatches BUILD_FAILED when dto build fails', async () => {
    buildPlanOrderWorkflowRequestDTOMock.mockResolvedValue({
      ok: false,
      error: { message: 'Route is not calculated' },
    })
    const { dispatch, dispatched } = makeDispatch()

    const { result } = renderHook(() =>
      useOrderPlanningSubmission({ ...baseArgs, dispatch }),
    )

    await act(async () => {
      await result.current.onValidSubmit({} as never)
    })

    expect(dispatched).toContainEqual({ type: 'SUBMIT_START' })
    expect(dispatched).toContainEqual({ type: 'BUILD_FAILED', routeError: 'Route is not calculated' })
    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('dispatches BACKEND_FAILED with section errors and first error step index', async () => {
    buildPlanOrderWorkflowRequestDTOMock.mockResolvedValue({ ok: true, payload: {} })
    parseWorkflowValidationErrorMock.mockReturnValue({
      fieldErrors: [{ field: 'trip.driver_id', code: 'ADR_REQUIRED', message: 'ADR required' }],
      globalErrors: [],
    })
    applyWorkflowApiErrorsMock.mockReturnValue('Submission failed')
    mutateMock.mockImplementation((_payload: unknown, opts: { onError?: (err: unknown) => void }) => {
      opts.onError?.(new Error('backend failed'))
    })

    const { dispatch, dispatched } = makeDispatch()
    const { result } = renderHook(() =>
      useOrderPlanningSubmission({ ...baseArgs, result: { distance_km: 12, duration_minutes: 10, polyline: 'abc' }, dispatch }),
    )

    await act(async () => {
      await result.current.onValidSubmit({} as never)
    })

    const backendFailedAction = dispatched.find((a) => a.type === 'BACKEND_FAILED')
    expect(backendFailedAction).toBeDefined()
    expect(backendFailedAction?.type).toBe('BACKEND_FAILED')
    if (backendFailedAction?.type === 'BACKEND_FAILED') {
      expect(backendFailedAction.routeError).toBe('Submission failed')
      expect(backendFailedAction.backendErrors.resources).toContain('ADR required')
      expect(backendFailedAction.stepIndex).toBe(3) // resources step index
    }
  })

  it('dispatches SUBMIT_SUCCESS, invalidates queries, shows toast and navigates on success', async () => {
    buildPlanOrderWorkflowRequestDTOMock.mockResolvedValue({ ok: true, payload: {} })
    mutateMock.mockImplementation(() => {
      mutationOptionsRef.onSuccess?.({ order: { id: 321 } })
    })

    const { dispatch, dispatched } = makeDispatch()
    const { result } = renderHook(() =>
      useOrderPlanningSubmission({ ...baseArgs, result: { distance_km: 12, duration_minutes: 10, polyline: 'abc' }, dispatch }),
    )

    await act(async () => {
      await result.current.onValidSubmit({} as never)
    })

    expect(dispatched).toContainEqual({ type: 'SUBMIT_START' })
    expect(dispatched).toContainEqual({ type: 'SUBMIT_SUCCESS' })
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['orders'] })
    expect(toastSuccessMock).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/orders/321')
  })

  it('calls setError for field-level backend validation errors', async () => {
    buildPlanOrderWorkflowRequestDTOMock.mockResolvedValue({ ok: true, payload: {} })
    parseWorkflowValidationErrorMock.mockReturnValue({ fieldErrors: [], globalErrors: [] })
    applyWorkflowApiErrorsMock.mockImplementation(
      (_err: unknown, setError: (name: string, error: { message: string }) => void) => {
        setError('vehicleId', { message: 'Vehicle required' })
        return 'Submission failed'
      },
    )
    mutateMock.mockImplementation((_payload: unknown, opts: { onError?: (err: unknown) => void }) => {
      opts.onError?.(new Error('backend failed'))
    })

    const setError = vi.fn()
    const { dispatch } = makeDispatch()
    const { result } = renderHook(() =>
      useOrderPlanningSubmission({ ...baseArgs, result: { distance_km: 12, duration_minutes: 10, polyline: 'abc' }, setError, dispatch }),
    )

    await act(async () => {
      await result.current.onValidSubmit({} as never)
    })

    expect(setError).toHaveBeenCalledWith('vehicleId', { message: 'Vehicle required' })
  })

  it('supports retry: first fails then succeeds on second submit', async () => {
    buildPlanOrderWorkflowRequestDTOMock.mockResolvedValue({ ok: true, payload: {} })
    applyWorkflowApiErrorsMock.mockReturnValue('Submission failed')

    let callNo = 0
    mutateMock.mockImplementation((_payload: unknown, opts: { onError?: (err: unknown) => void }) => {
      callNo += 1
      if (callNo === 1) {
        opts.onError?.(new Error('first fail'))
      } else {
        mutationOptionsRef.onSuccess?.({ order: { id: 555 } })
      }
    })

    const { dispatch, dispatched } = makeDispatch()
    const { result } = renderHook(() =>
      useOrderPlanningSubmission({ ...baseArgs, result: { distance_km: 12, duration_minutes: 10, polyline: 'abc' }, dispatch }),
    )

    await act(async () => { await result.current.onValidSubmit({} as never) })
    await act(async () => { await result.current.onValidSubmit({} as never) })

    expect(dispatched.filter((a) => a.type === 'BACKEND_FAILED')).toHaveLength(1)
    expect(dispatched.filter((a) => a.type === 'SUBMIT_SUCCESS')).toHaveLength(1)
    expect(navigateMock).toHaveBeenCalledWith('/orders/555')
  })
})
