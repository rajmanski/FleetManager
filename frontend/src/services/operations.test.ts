import { planOrderWorkflow } from './operations'
import api from '@/services/api'

vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('services/operations planOrderWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts payload to integrated workflow endpoint and returns response data', async () => {
    ;(api.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        status: 'planned',
        order: { id: 1, order_number: 'ORD-1', status: 'InProgress' },
        route: { id: 2, planned_distance_km: 100, estimated_time_min: 80 },
        trip: { id: 3, status: 'Scheduled', vehicle_id: 5, driver_id: 7, start_time: '2026-01-01T10:00:00Z' },
        summary: { cargo_count: 1, total_weight_kg: 100, waypoints_count: 0, distance_km: 100, estimated_time_min: 80 },
      },
    })

    const payload = {
      order: { client_id: 1, order_number: 'ORD-1' },
      cargo: [],
      route: { start_location: 'A', end_location: 'B', waypoints: [] },
      trip: { vehicle_id: 5, driver_id: 7, start_time: '2026-01-01T10:00:00Z' },
    } as never

    const response = await planOrderWorkflow(payload)

    expect(api.post).toHaveBeenCalledWith('/api/v1/operations/orders/plan', payload)
    expect(response.status).toBe('planned')
  })

  it('propagates api errors to caller', async () => {
    const err = new Error('network error')
    ;(api.post as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(err)

    await expect(
      planOrderWorkflow({
        order: { client_id: 1, order_number: 'ORD-1' },
        cargo: [],
        route: { start_location: 'A', end_location: 'B', waypoints: [] },
        trip: { vehicle_id: 5, driver_id: 7, start_time: '2026-01-01T10:00:00Z' },
      } as never),
    ).rejects.toBe(err)
  })
})
