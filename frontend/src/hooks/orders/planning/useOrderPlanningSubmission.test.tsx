import { act, renderHook } from '@testing-library/react'
import { useOrderPlanningSubmission } from './useOrderPlanningSubmission'

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
      return {
      isPending: false,
      error: null,
      mutate: mutateMock,
      }
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

describe('useOrderPlanningSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets partial validation state when dto build fails', async () => {
    buildPlanOrderWorkflowRequestDTOMock.mockResolvedValue({
      ok: false,
      error: { message: 'Route is not calculated' },
    })

    const setRouteFlowError = vi.fn()
    const setBackendSectionErrors = vi.fn()
    const setSubmissionState = vi.fn()
    const setLastErrorSource = vi.fn()
    const setActiveStepIndex = vi.fn()

    const { result } = renderHook(() =>
      useOrderPlanningSubmission({
        origin: { address: '', lat: undefined, lng: undefined },
        destination: { address: '', lat: undefined, lng: undefined },
        waypoints: [],
        result: null,
        steps: [{ id: 'route' }],
        setError: vi.fn(),
        setRouteFlowError,
        setBackendSectionErrors,
        setSubmissionState,
        setLastErrorSource,
        setActiveStepIndex,
      }),
    )

    await act(async () => {
      await result.current.onValidSubmit({} as never)
    })

    expect(setSubmissionState).toHaveBeenCalledWith('partial_validation')
    expect(setRouteFlowError).toHaveBeenCalledWith('Route is not calculated')
    expect(setActiveStepIndex).toHaveBeenCalledWith(2)
    expect(setLastErrorSource).toHaveBeenCalledWith('local')
    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('sets retry state when backend mutate fails', async () => {
    buildPlanOrderWorkflowRequestDTOMock.mockResolvedValue({
      ok: true,
      payload: { order: {} },
    })
    parseWorkflowValidationErrorMock.mockReturnValue({
      fieldErrors: [{ field: 'trip.driver_id', code: 'ADR_REQUIRED', message: 'ADR required' }],
      globalErrors: [],
    })
    applyWorkflowApiErrorsMock.mockReturnValue('Submission failed')

    const setRouteFlowError = vi.fn()
    const setBackendSectionErrors = vi.fn()
    const setSubmissionState = vi.fn()
    const setLastErrorSource = vi.fn()
    const setActiveStepIndex = vi.fn()

    mutateMock.mockImplementation((_payload: unknown, opts: { onError?: (err: unknown) => void }) => {
      opts.onError?.(new Error('backend failed'))
    })

    const { result } = renderHook(() =>
      useOrderPlanningSubmission({
        origin: { address: '', lat: undefined, lng: undefined },
        destination: { address: '', lat: undefined, lng: undefined },
        waypoints: [],
        result: { distance_km: 12, duration_minutes: 10, polyline: 'abc' },
        steps: [{ id: 'client_order' }, { id: 'cargo' }, { id: 'route' }, { id: 'resources' }, { id: 'summary' }],
        setError: vi.fn(),
        setRouteFlowError,
        setBackendSectionErrors,
        setSubmissionState,
        setLastErrorSource,
        setActiveStepIndex,
      }),
    )

    await act(async () => {
      await result.current.onValidSubmit({} as never)
    })

    expect(setSubmissionState).toHaveBeenCalledWith('retry')
    expect(setLastErrorSource).toHaveBeenCalledWith('backend')
    expect(setRouteFlowError).toHaveBeenCalledWith('Submission failed')
  })

  it('handles success by invalidating orders, showing toast and navigating', async () => {
    buildPlanOrderWorkflowRequestDTOMock.mockResolvedValue({
      ok: true,
      payload: { order: {} },
    })
    mutateMock.mockImplementation(
      () => {
        mutationOptionsRef.onSuccess?.({ order: { id: 321 } })
      },
    )

    const setSubmissionState = vi.fn()

    const { result } = renderHook(() =>
      useOrderPlanningSubmission({
        origin: { address: '', lat: undefined, lng: undefined },
        destination: { address: '', lat: undefined, lng: undefined },
        waypoints: [],
        result: { distance_km: 12, duration_minutes: 10, polyline: 'abc' },
        steps: [{ id: 'client_order' }, { id: 'cargo' }, { id: 'route' }, { id: 'resources' }, { id: 'summary' }],
        setError: vi.fn(),
        setRouteFlowError: vi.fn(),
        setBackendSectionErrors: vi.fn(),
        setSubmissionState,
        setLastErrorSource: vi.fn(),
        setActiveStepIndex: vi.fn(),
      }),
    )

    await act(async () => {
      await result.current.onValidSubmit({} as never)
    })

    expect(setSubmissionState).toHaveBeenCalledWith('loading')
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['orders'] })
    expect(toastSuccessMock).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/orders/321')
  })

  it('maps backend field errors to RHF setError paths', async () => {
    buildPlanOrderWorkflowRequestDTOMock.mockResolvedValue({
      ok: true,
      payload: { order: {} },
    })
    parseWorkflowValidationErrorMock.mockReturnValue({
      fieldErrors: [
        { field: 'trip.vehicle_id', code: 'REQUIRED', message: 'Vehicle required' },
        { field: 'cargo[0].weight_kg', code: 'INVALID', message: 'Weight invalid' },
      ],
      globalErrors: [],
    })
    applyWorkflowApiErrorsMock.mockImplementation((_err: unknown, setError: (name: string, error: { message: string }) => void) => {
      setError('vehicleId', { message: 'Vehicle required' })
      setError('cargo.0.weightPerUnitKg', { message: 'Weight invalid' })
      return 'Submission failed'
    })

    const setError = vi.fn()
    mutateMock.mockImplementation((_payload: unknown, opts: { onError?: (err: unknown) => void }) => {
      opts.onError?.(new Error('backend failed'))
    })

    const { result } = renderHook(() =>
      useOrderPlanningSubmission({
        origin: { address: '', lat: undefined, lng: undefined },
        destination: { address: '', lat: undefined, lng: undefined },
        waypoints: [],
        result: { distance_km: 12, duration_minutes: 10, polyline: 'abc' },
        steps: [{ id: 'client_order' }, { id: 'cargo' }, { id: 'route' }, { id: 'resources' }, { id: 'summary' }],
        setError,
        setRouteFlowError: vi.fn(),
        setBackendSectionErrors: vi.fn(),
        setSubmissionState: vi.fn(),
        setLastErrorSource: vi.fn(),
        setActiveStepIndex: vi.fn(),
      }),
    )

    await act(async () => {
      await result.current.onValidSubmit({} as never)
    })

    expect(setError).toHaveBeenCalledWith('vehicleId', { message: 'Vehicle required' })
    expect(setError).toHaveBeenCalledWith('cargo.0.weightPerUnitKg', { message: 'Weight invalid' })
  })

  it('supports retry flow: first error then successful submit', async () => {
    buildPlanOrderWorkflowRequestDTOMock.mockResolvedValue({
      ok: true,
      payload: { order: {} },
    })
    applyWorkflowApiErrorsMock.mockReturnValue('Submission failed')

    const setSubmissionState = vi.fn()
    const setRouteFlowError = vi.fn()
    const setLastErrorSource = vi.fn()

    let callNo = 0
    mutateMock.mockImplementation((_payload: unknown, opts: { onError?: (err: unknown) => void }) => {
      callNo += 1
      if (callNo === 1) {
        opts.onError?.(new Error('first fail'))
      } else {
        mutationOptionsRef.onSuccess?.({ order: { id: 555 } })
      }
    })

    const { result } = renderHook(() =>
      useOrderPlanningSubmission({
        origin: { address: '', lat: undefined, lng: undefined },
        destination: { address: '', lat: undefined, lng: undefined },
        waypoints: [],
        result: { distance_km: 12, duration_minutes: 10, polyline: 'abc' },
        steps: [{ id: 'client_order' }, { id: 'cargo' }, { id: 'route' }, { id: 'resources' }, { id: 'summary' }],
        setError: vi.fn(),
        setRouteFlowError,
        setBackendSectionErrors: vi.fn(),
        setSubmissionState,
        setLastErrorSource,
        setActiveStepIndex: vi.fn(),
      }),
    )

    await act(async () => {
      await result.current.onValidSubmit({} as never)
    })
    await act(async () => {
      await result.current.onValidSubmit({} as never)
    })

    expect(setSubmissionState).toHaveBeenCalledWith('retry')
    expect(setLastErrorSource).toHaveBeenCalledWith('backend')
    expect(setRouteFlowError).toHaveBeenCalledWith('Submission failed')
    expect(navigateMock).toHaveBeenCalledWith('/orders/555')
  })
})
