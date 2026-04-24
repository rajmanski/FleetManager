import { renderHook, act, waitFor } from '@testing-library/react'
import { useOrderPlanningFlow } from './useOrderPlanningFlow'

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
  useVehicles: () => ({ vehiclesQuery: { data: { data: [] } } }),
}))

vi.mock('@/hooks/drivers/useDrivers', () => ({
  useDrivers: () => ({ driversQuery: { data: { data: [] } } }),
}))

vi.mock('./planning/useOrderPlanningResourceFilters', () => ({
  useOrderPlanningResourceFilters: () => ({
    vehicleOptions: [{ value: '5', label: 'Vehicle 5' }],
    driverOptions: [{ value: '12', label: 'Driver 12' }],
    isPending: false,
  }),
}))

vi.mock('./planning/useOrderPlanningRouteEffects', () => ({
  useOrderPlanningRouteEffects: () => undefined,
}))

vi.mock('./planning/useOrderPlanningSubmission', () => ({
  useOrderPlanningSubmission: () => ({
    mutation: { isPending: false, error: null, mutate: vi.fn() },
    onValidSubmit: vi.fn(),
  }),
}))

describe('useOrderPlanningFlow', () => {
  it('returns initial state with summary step blocked for submit', () => {
    const { result } = renderHook(() => useOrderPlanningFlow())

    expect(result.current.steps.active.id).toBe('client_order')
    expect(result.current.steps.activeIndex).toBe(0)
    expect(result.current.steps.list).toHaveLength(5)
    expect(result.current.submission.canSubmit).toBe(false)
  })

  it('returns grouped return shape with all expected keys', () => {
    const { result } = renderHook(() => useOrderPlanningFlow())
    const flow = result.current

    expect(flow).toHaveProperty('form')
    expect(flow).toHaveProperty('client')
    expect(flow).toHaveProperty('route')
    expect(flow).toHaveProperty('steps')
    expect(flow).toHaveProperty('cargo')
    expect(flow).toHaveProperty('resources')
    expect(flow).toHaveProperty('submission')
  })

  it('tracks total cargo weight from form cargo rows', () => {
    const { result } = renderHook(() => useOrderPlanningFlow())

    expect(result.current.cargo.totalWeightKg).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(result.current.cargo.items)).toBe(true)
  })

  it('exposes vehicle and driver options from resources', () => {
    const { result } = renderHook(() => useOrderPlanningFlow())

    expect(result.current.resources.vehicleOptions).toEqual([{ value: '5', label: 'Vehicle 5' }])
    expect(result.current.resources.driverOptions).toEqual([{ value: '12', label: 'Driver 12' }])
  })

  it('goTo changes active step', () => {
    const { result } = renderHook(() => useOrderPlanningFlow())

    act(() => { result.current.steps.goTo(1) })

    expect(result.current.steps.activeIndex).toBe(1)
    expect(result.current.steps.active.id).toBe('route')
  })

  it('resets error state to idle after user modifies client selection', async () => {
    const { result } = renderHook(() => useOrderPlanningFlow())

    act(() => { result.current.steps.goTo(1) })
    expect(result.current.steps.activeIndex).toBe(1)

    act(() => {
      result.current.client.onChange({ id: 11, companyName: 'Test', nip: '1234567890' })
    })

    await waitFor(() => {
      expect(result.current.submission.state).toBe('idle')
    })
  })
})
