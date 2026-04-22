import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { useOrderPlanningResourceFilters } from './useOrderPlanningResourceFilters'
import api from '@/services/api'

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useOrderPlanningResourceFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters vehicles by capacity and availability, and ADR drivers for hazardous cargo', async () => {
    ;(api.get as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/vehicles/1/availability')) return Promise.resolve({ data: { available: true } })
      if (url.includes('/vehicles/2/availability')) return Promise.resolve({ data: { available: true } })
      if (url.includes('/drivers/10/availability')) return Promise.resolve({ data: { available: true } })
      if (url.includes('/drivers/11/availability')) return Promise.resolve({ data: { available: true } })
      return Promise.resolve({ data: { available: false } })
    })

    const { result } = renderHook(
      () =>
        useOrderPlanningResourceFilters({
          vehicles: [
            { id: 1, vin: 'VIN1', plate_number: 'WX1', brand: 'A', model: 'B', capacity_kg: 800 } as never,
            { id: 2, vin: 'VIN2', plate_number: 'WX2', brand: 'A', model: 'B', capacity_kg: 2000 } as never,
          ],
          drivers: [
            { id: 10, first_name: 'Jan', last_name: 'NoAdr', adr_certified: false } as never,
            { id: 11, first_name: 'Ada', last_name: 'Adr', adr_certified: true, adr_expiry_date: '2099-01-01' } as never,
          ],
          startTime: '2026-06-01T10:00',
          totalWeightKg: 1000,
          hasHazardousCargo: true,
          selectedVehicleId: '',
          selectedDriverId: '',
          setVehicleId: vi.fn(),
          setDriverId: vi.fn(),
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.vehicleOptions).toHaveLength(1)
      expect(result.current.vehicleOptions[0]?.value).toBe('2')
      expect(result.current.driverOptions).toHaveLength(1)
      expect(result.current.driverOptions[0]?.value).toBe('11')
    })
  })

  it('clears selected vehicle/driver when they become unavailable', async () => {
    ;(api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { available: false } })
    const setVehicleId = vi.fn()
    const setDriverId = vi.fn()

    renderHook(
      () =>
        useOrderPlanningResourceFilters({
          vehicles: [{ id: 1, vin: 'VIN1', plate_number: 'WX1', brand: 'A', model: 'B', capacity_kg: 1200 } as never],
          drivers: [{ id: 10, first_name: 'Jan', last_name: 'Test', adr_certified: true } as never],
          startTime: '2026-06-01T10:00',
          totalWeightKg: 500,
          hasHazardousCargo: false,
          selectedVehicleId: '1',
          selectedDriverId: '10',
          setVehicleId,
          setDriverId,
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(setVehicleId).toHaveBeenCalledWith('')
      expect(setDriverId).toHaveBeenCalledWith('')
    })
  })

  it('handles mixed availability responses (one api error, one success)', async () => {
    ;(api.get as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/vehicles/1/availability')) {
        return Promise.reject(new Error('timeout'))
      }
      if (url.includes('/drivers/10/availability')) {
        return Promise.resolve({ data: { available: true } })
      }
      return Promise.resolve({ data: { available: false } })
    })

    const { result } = renderHook(
      () =>
        useOrderPlanningResourceFilters({
          vehicles: [{ id: 1, vin: 'VIN1', plate_number: 'WX1', brand: 'A', model: 'B', capacity_kg: 1200 } as never],
          drivers: [{ id: 10, first_name: 'Jan', last_name: 'Test', adr_certified: true } as never],
          startTime: '2026-06-01T10:00',
          totalWeightKg: 500,
          hasHazardousCargo: false,
          selectedVehicleId: '',
          selectedDriverId: '',
          setVehicleId: vi.fn(),
          setDriverId: vi.fn(),
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.vehicleOptions).toHaveLength(0)
      expect(result.current.driverOptions).toHaveLength(1)
    })
  })
})
