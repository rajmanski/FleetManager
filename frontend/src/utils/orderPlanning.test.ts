import {
  buildPlanOrderWorkflowRequestDTO,
  datetimeLocalToRfc3339,
  draftsToPlanCargo,
} from './orderPlanning'
import { geocodeAddress } from '@/services/routes'

vi.mock('@/services/routes', () => ({
  geocodeAddress: vi.fn(),
}))

describe('orderPlanning utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('converts cargo drafts to aggregated payload values', () => {
    const out = draftsToPlanCargo([
      {
        id: 'c1',
        description: 'Pallet',
        quantity: '3',
        weightPerUnitKg: '100',
        volumePerUnitM3: '2.5',
        cargoType: 'General',
        destinationWaypointTempId: 'wp-1',
      } as never,
    ])

    expect(out[0]).toEqual({
      description: '3 × Pallet',
      weight_kg: 300,
      volume_m3: 7.5,
      cargo_type: 'General',
      destination_waypoint_temp_id: 'wp-1',
    })
  })

  it('returns route error when route is not calculated', async () => {
    const result = await buildPlanOrderWorkflowRequestDTO(
      {
        clientId: 1,
        orderNumber: 'ORD-1',
        deliveryDeadline: '',
        totalPricePln: '',
        cargo: [],
        vehicleId: '1',
        driverId: '2',
        startTime: '2026-06-01T10:00',
      } as never,
      { address: 'Warszawa', lat: 52.22, lng: 21.01 } as never,
      { address: 'Krakow', lat: 50.06, lng: 19.94 } as never,
      [],
      null,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe('route')
    }
  })

  it('builds full workflow payload with geocoding fallback', async () => {
    ;(geocodeAddress as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      latitude: 51.1,
      longitude: 17.0,
    })

    const result = await buildPlanOrderWorkflowRequestDTO(
      {
        clientId: 10,
        orderNumber: ' ORD-2026-77 ',
        deliveryDeadline: '2026-06-10',
        totalPricePln: '12500.50',
        cargo: [
          {
            id: 'c1',
            description: 'Boxes',
            quantity: '2',
            weightPerUnitKg: '150',
            volumePerUnitM3: '1.25',
            cargoType: 'Hazardous',
            destinationWaypointTempId: 'wp-a',
          },
        ],
        vehicleId: '5',
        driverId: '12',
        startTime: '2026-06-01T10:00',
      } as never,
      { address: 'Warszawa', lat: 52.22, lng: 21.01 } as never,
      { address: 'Krakow', lat: 50.06, lng: 19.94 } as never,
      [
        {
          tempId: 'wp-a',
          address: 'Wroclaw',
          lat: null,
          lng: null,
          actionType: 'Dropoff',
        },
      ] as never,
      { distance_km: 320.4, duration_minutes: 290.2, polyline: 'abc' },
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.order.order_number).toBe('ORD-2026-77')
      expect(result.payload.trip.vehicle_id).toBe(5)
      expect(result.payload.cargo[0]?.weight_kg).toBe(300)
      expect(result.payload.route.waypoints[0]?.latitude).toBe(51.1)
      expect(result.payload.route.estimated_time_min).toBe(290)
    }
  })

  it('builds payload for multiple waypoints and cargo destination mapping', async () => {
    ;(geocodeAddress as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ latitude: 51.11, longitude: 17.01 })
      .mockResolvedValueOnce({ latitude: 52.15, longitude: 21.02 })

    const result = await buildPlanOrderWorkflowRequestDTO(
      {
        clientId: 10,
        orderNumber: 'ORD-2026-88',
        deliveryDeadline: '',
        totalPricePln: '',
        cargo: [
          {
            id: 'c1',
            description: 'A',
            quantity: '1',
            weightPerUnitKg: '100',
            volumePerUnitM3: '1',
            cargoType: 'General',
            destinationWaypointTempId: 'wp-a',
          },
          {
            id: 'c2',
            description: 'B',
            quantity: '2',
            weightPerUnitKg: '50',
            volumePerUnitM3: '0.5',
            cargoType: 'Refrigerated',
            destinationWaypointTempId: 'wp-b',
          },
        ],
        vehicleId: '5',
        driverId: '12',
        startTime: '2026-06-01T10:00',
      } as never,
      { address: 'Warszawa', lat: 52.22, lng: 21.01 } as never,
      { address: 'Krakow', lat: 50.06, lng: 19.94 } as never,
      [
        { tempId: 'wp-a', address: 'Wroclaw', lat: null, lng: null, actionType: 'Dropoff' },
        { tempId: 'wp-b', address: 'Lodz', lat: null, lng: null, actionType: 'Stopover' },
      ] as never,
      { distance_km: 320.4, duration_minutes: 290.2, polyline: 'abc' },
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.route.waypoints).toHaveLength(2)
      expect(result.payload.route.waypoints[0]?.temp_id).toBe('wp-a')
      expect(result.payload.route.waypoints[1]?.temp_id).toBe('wp-b')
      expect(result.payload.cargo[0]?.destination_waypoint_temp_id).toBe('wp-a')
      expect(result.payload.cargo[1]?.destination_waypoint_temp_id).toBe('wp-b')
    }
  })

  it('converts datetime-local string to RFC3339 format', () => {
    const iso = datetimeLocalToRfc3339('2026-06-01T10:00')
    expect(iso).toMatch(/^2026-06-01T/)
    expect(iso.endsWith('Z')).toBe(true)
  })

  it('throws for invalid datetime-local value', () => {
    expect(() => datetimeLocalToRfc3339('not-a-date')).toThrow('Invalid trip start time')
  })
})
