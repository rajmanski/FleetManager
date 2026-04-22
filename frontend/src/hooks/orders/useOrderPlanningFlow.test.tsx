import { renderHook } from '@testing-library/react'
import { useOrderPlanningFlow } from './useOrderPlanningFlow'
import { act, waitFor } from '@testing-library/react'

vi.mock('@/hooks/routes/useRoutePlanning', () => ({
  useRoutePlanning: () => ({
    origin: { address: '', lat: null, lng: null },
    setOrigin: vi.fn(),
    destination: { address: '', lat: null, lng: null },
    setDestination: vi.fn(),
    waypoints: [],
    setWaypoints: vi.fn(),
    points: [],
    polyline: null,
    result: { distance_km: 120, duration_minutes: 110, polyline: 'abc' },
    isCalculating: false,
    error: null,
    calculateRoute: vi.fn(async () => {}),
    handleMapClick: vi.fn(async () => {}),
    showMap: true,
  }),
}))

vi.mock('@/hooks/vehicles/useVehicles', () => ({
  useVehicles: () => ({
    vehiclesQuery: { data: { data: [] } },
  }),
}))

vi.mock('@/hooks/drivers/useDrivers', () => ({
  useDrivers: () => ({
    driversQuery: { data: { data: [] } },
  }),
}))

vi.mock('./planning/useOrderPlanningResourceFilters', () => ({
  useOrderPlanningResourceFilters: () => ({
    vehicleOptions: [{ value: '5', label: 'Vehicle 5' }],
    driverOptions: [{ value: '12', label: 'Driver 12' }],
    isCheckingAvailability: false,
  }),
}))

vi.mock('./planning/useOrderPlanningRouteEffects', () => ({
  useOrderPlanningRouteEffects: () => undefined,
}))

let submissionArgsRef:
  | {
      setRouteFlowError: (message: string | null) => void
      setBackendSectionErrors: (errors: {
        client_order: string[]
        cargo: string[]
        route: string[]
        resources: string[]
        summary: string[]
      }) => void
      setSubmissionState: (state: 'idle' | 'partial_validation' | 'loading' | 'retry') => void
      setLastErrorSource: (source: 'none' | 'backend' | 'local') => void
    }
  | undefined

vi.mock('./planning/useOrderPlanningSubmission', () => ({
  useOrderPlanningSubmission: (args: typeof submissionArgsRef) => {
    submissionArgsRef = args
    return {
      mutation: { isPending: false, error: null, mutate: vi.fn() },
      onValidSubmit: vi.fn(),
    }
  },
}))

describe('useOrderPlanningFlow', () => {
  it('returns initial state with blocked submit before summary step', () => {
    const { result } = renderHook(() => useOrderPlanningFlow())

    expect(result.current.activeStep.id).toBe('client_order')
    expect(result.current.canSubmit).toBe(false)
    expect(result.current.steps).toHaveLength(5)
  })

  it('tracks total cargo weight from form cargo rows', () => {
    const { result } = renderHook(() => useOrderPlanningFlow())

    expect(result.current.totalWeightKg).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(result.current.cargoWatch)).toBe(true)
  })

  it('resets backend/local error state after retry state resumes and user edits', async () => {
    const { result } = renderHook(() => useOrderPlanningFlow())

    act(() => {
      submissionArgsRef?.setRouteFlowError('Backend validation failed')
      submissionArgsRef?.setBackendSectionErrors({
        client_order: [],
        cargo: [],
        route: ['Route failed'],
        resources: [],
        summary: [],
      })
      submissionArgsRef?.setSubmissionState('loading')
      submissionArgsRef?.setLastErrorSource('backend')
    })

    await waitFor(() => {
      expect(result.current.submissionState).toBe('loading')
      expect(result.current.routeFlowError).toBe('Backend validation failed')
    })

    act(() => {
      result.current.setSelectedClient({
        id: 11,
        companyName: 'Changed Client',
        nip: '1234567890',
      })
    })

    await waitFor(() => {
      expect(result.current.submissionState).toBe('loading')
      expect(result.current.routeFlowError).toBe('Backend validation failed')
    })

    act(() => {
      submissionArgsRef?.setSubmissionState('retry')
    })

    await waitFor(() => {
      expect(result.current.submissionState).toBe('idle')
      expect(result.current.routeFlowError).toBeNull()
      expect(result.current.backendSectionErrors.route).toHaveLength(0)
    })
  })
})
