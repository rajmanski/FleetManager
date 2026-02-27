package waypoints

import "errors"

var (
	ErrWaypointNotFound      = errors.New("waypoint not found")
	ErrInvalidWaypointInput  = errors.New("invalid waypoint input")
	ErrRouteIDNotFound       = errors.New("route not found")
	ErrRouteHasActiveTrip    = errors.New("cannot modify waypoints: order has active or scheduled trip")
	ErrWaypointLimitExceeded = errors.New("maximum 10 waypoints per route")
)
