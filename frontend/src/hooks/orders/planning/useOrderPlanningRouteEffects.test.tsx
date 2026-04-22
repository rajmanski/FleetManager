import { renderHook } from '@testing-library/react'
import { useOrderPlanningRouteEffects } from './useOrderPlanningRouteEffects'
import type { OrderPlanningFormValues } from '@/schemas/orderPlanning'
import type { UseFormGetValues } from 'react-hook-form'

vi.mock('@/utils/googleMapsLoader', () => ({
  loadMapsLibrary: vi.fn(async () => {}),
}))

describe('useOrderPlanningRouteEffects', () => {
  it('generates missing waypoint temp ids and clears invalid cargo waypoint refs', () => {
    const setWaypoints = vi.fn()
    const getValues = vi.fn((field?: keyof OrderPlanningFormValues) => {
      if (field === 'cargo') {
        return [
          {
            id: 'c1',
            description: 'Item 1',
            quantity: '1',
            weightPerUnitKg: '10',
            volumePerUnitM3: '1',
            cargoType: 'General',
            destinationWaypointTempId: 'missing',
          },
          {
            id: 'c2',
            description: 'Item 2',
            quantity: '1',
            weightPerUnitKg: '10',
            volumePerUnitM3: '1',
            cargoType: 'General',
            destinationWaypointTempId: 'wp-2',
          },
        ]
      }
      return {
        clientId: 1,
        orderNumber: 'ORD-1',
        deliveryDeadline: '',
        totalPricePln: '',
        cargo: [],
        vehicleId: '',
        driverId: '',
        startTime: '',
      } satisfies OrderPlanningFormValues
    }) as unknown as UseFormGetValues<OrderPlanningFormValues>
    const setValue = vi.fn()

    renderHook(() =>
      useOrderPlanningRouteEffects({
        waypoints: [
          { tempId: '', address: 'A', actionType: 'Pickup' } as never,
          { tempId: 'wp-2', address: 'B', actionType: 'Dropoff' } as never,
        ],
        setWaypoints,
        getValues,
        setValue,
      }),
    )

    expect(setWaypoints).toHaveBeenCalled()
    const updater = setWaypoints.mock.calls[0][0] as (prev: Array<{ tempId?: string }>) => Array<{ tempId?: string }>
    const updated = updater([{ tempId: '' }, { tempId: 'wp-2' }])
    expect(updated[0]?.tempId).toBeTruthy()
    expect(updated[1]?.tempId).toBe('wp-2')

    expect(setValue).toHaveBeenCalledWith(
      'cargo',
      expect.arrayContaining([
        expect.objectContaining({ id: 'c1', destinationWaypointTempId: null }),
        expect.objectContaining({ id: 'c2', destinationWaypointTempId: 'wp-2' }),
      ]),
      { shouldValidate: true },
    )
  })
})
