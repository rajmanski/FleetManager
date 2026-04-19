export type PlanOrderWorkflowRequestDTO = {
  order: {
    client_id: number
    order_number: string
    delivery_deadline?: string | null
    total_price_pln?: number | null
  }
  cargo: Array<{
    description: string
    weight_kg: number
    volume_m3: number
    cargo_type: string
    destination_waypoint_temp_id?: string | null
  }>
  route: {
    start_location: string
    end_location: string
    planned_distance_km?: number | null
    estimated_time_min?: number | null
    waypoints: Array<{
      temp_id: string
      sequence_order: number
      address: string
      latitude: number
      longitude: number
      action_type: string
    }>
  }
  trip: {
    vehicle_id: number
    driver_id: number
    start_time: string
  }
}

export type PlanOrderWorkflowResponseDTO = {
  status: string
  order: {
    id: number
    order_number: string
    status: string
  }
  route: {
    id: number
    planned_distance_km?: number | null
    estimated_time_min?: number | null
  }
  trip: {
    id: number
    status: string
    vehicle_id: number
    driver_id: number
    start_time: string
  }
  summary: {
    cargo_count: number
    total_weight_kg: number
    waypoints_count: number
    distance_km: number
    estimated_time_min: number
  }
}

export type WorkflowFieldError = {
  field: string
  code: string
  message: string
}

export type WorkflowValidationErrorBody = {
  code: string
  message: string
  field_errors: WorkflowFieldError[]
  global_errors: WorkflowFieldError[]
}
