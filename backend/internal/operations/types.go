package operations

type PlanOrderWorkflowRequest struct {
	Order PlanOrderInput `json:"order"`
	Cargo []PlanCargo    `json:"cargo"`
	Route PlanRouteInput `json:"route"`
	Trip  PlanTripInput  `json:"trip"`
}

type PlanOrderInput struct {
	ClientID         int64    `json:"client_id"`
	OrderNumber      string   `json:"order_number"`
	DeliveryDeadline *string  `json:"delivery_deadline"`
	TotalPricePln    *float64 `json:"total_price_pln"`
}

type PlanCargo struct {
	Description               string  `json:"description"`
	WeightKg                  float64 `json:"weight_kg"`
	VolumeM3                  float64 `json:"volume_m3"`
	CargoType                 string  `json:"cargo_type"`
	DestinationWaypointTempID *string `json:"destination_waypoint_temp_id"`
}

type PlanRouteInput struct {
	StartLocation     string         `json:"start_location"`
	EndLocation       string         `json:"end_location"`
	PlannedDistanceKm *float64       `json:"planned_distance_km"`
	EstimatedTimeMin  *int32         `json:"estimated_time_min"`
	Waypoints         []PlanWaypoint `json:"waypoints"`
}

type PlanWaypoint struct {
	TempID        string  `json:"temp_id"`
	SequenceOrder int32   `json:"sequence_order"`
	Address       string  `json:"address"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	ActionType    string  `json:"action_type"`
}

type PlanTripInput struct {
	VehicleID int64  `json:"vehicle_id"`
	DriverID  int64  `json:"driver_id"`
	StartTime string `json:"start_time"`
}

type PlanOrderWorkflowResponse struct {
	Status  string               `json:"status"`
	Order   PlannedOrderSummary  `json:"order"`
	Route   PlannedRouteSummary  `json:"route"`
	Trip    PlannedTripSummary   `json:"trip"`
	Summary PlannedOrderOverview `json:"summary"`
}

type PlannedOrderSummary struct {
	ID          int64  `json:"id"`
	OrderNumber string `json:"order_number"`
	Status      string `json:"status"`
}

type PlannedRouteSummary struct {
	ID                int64    `json:"id"`
	PlannedDistanceKm *float64 `json:"planned_distance_km,omitempty"`
	EstimatedTimeMin  *int32   `json:"estimated_time_min,omitempty"`
}

type PlannedTripSummary struct {
	ID        int64  `json:"id"`
	Status    string `json:"status"`
	VehicleID int64  `json:"vehicle_id"`
	DriverID  int64  `json:"driver_id"`
	StartTime string `json:"start_time"`
}

type PlannedOrderOverview struct {
	CargoCount       int     `json:"cargo_count"`
	TotalWeightKg    float64 `json:"total_weight_kg"`
	WaypointsCount   int     `json:"waypoints_count"`
	DistanceKm       float64 `json:"distance_km"`
	EstimatedTimeMin int32   `json:"estimated_time_min"`
}
