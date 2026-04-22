import { mapWorkflowFieldToFormPath } from './orderPlanningWorkflowErrors'

describe('orderPlanningWorkflowErrors mapping', () => {
  it('maps top-level workflow fields to form paths', () => {
    expect(mapWorkflowFieldToFormPath('order.client_id')).toBe('clientId')
    expect(mapWorkflowFieldToFormPath('trip.start_time')).toBe('startTime')
  })

  it('maps cargo nested field names from snake_case to form paths', () => {
    expect(mapWorkflowFieldToFormPath('cargo[2].weight_kg')).toBe('cargo.2.weightPerUnitKg')
    expect(mapWorkflowFieldToFormPath('cargo[1].cargo_type')).toBe('cargo.1.cargoType')
  })

  it('returns null for unknown fields', () => {
    expect(mapWorkflowFieldToFormPath('route.waypoints[0].sequence_order')).toBeNull()
  })
})
