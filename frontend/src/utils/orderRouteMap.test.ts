import { describe, expect, it } from 'vitest'
import { buildOrderRouteMapPoints } from './orderRouteMap'

describe('buildOrderRouteMapPoints', () => {
  it('builds a route from start and end even when there are no intermediate waypoints', () => {
    const points = buildOrderRouteMapPoints(
      { lat: 52.2297, lng: 21.0122, address: 'Warszawa' },
      { lat: 51.7592, lng: 19.456, address: 'Lodz' },
      [],
    )

    expect(points).toEqual([
      { lat: 52.2297, lng: 21.0122, type: 'Pickup', label: 'Start: Warszawa' },
      { lat: 51.7592, lng: 19.456, type: 'Dropoff', label: 'End: Lodz' },
    ])
  })
})
