package waypoints

// Route is used by RoutesRepository for waypoint operations (route existence, active trip check).
type Route struct {
	RouteID  int64
	OrderID  int64
	StartLoc string
	EndLoc   string
}

type Waypoint struct {
	WaypointID    int64   `json:"waypoint_id"`
	RouteID       int64   `json:"route_id"`
	SequenceOrder int32   `json:"sequence_order"`
	Address       string  `json:"address"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	ActionType    string  `json:"action_type"`
}

type CreateWaypointInput struct {
	RouteID       int64
	SequenceOrder int32
	Address       string
	Latitude      float64
	Longitude     float64
	ActionType    string
}

type UpdateWaypointInput struct {
	WaypointID    int64
	SequenceOrder int32
	Address       string
	Latitude      float64
	Longitude     float64
	ActionType    string
}

type WaypointReorderItem struct {
	WaypointID    int64
	SequenceOrder int32
}

const (
	ActionTypePickup   = "Pickup"
	ActionTypeDropoff  = "Dropoff"
	ActionTypeStopover = "Stopover"
)

const maxWaypointsPerRoute = 10
