package routes

import "errors"

var (
	ErrAPIKeyNotConfigured    = errors.New("Google Maps API key is not configured")
	ErrAddressRequired        = errors.New("address is required")
	ErrAddressNotFound        = errors.New("address not found")
	ErrGeocodingDenied        = errors.New("geocoding request denied")
	ErrGeocodingQuotaExceeded = errors.New("geocoding quota exceeded")
	ErrInvalidRequest         = errors.New("invalid geocoding request")
	ErrRouteNotFound          = errors.New("route not found between points")
	ErrTooManyWaypoints       = errors.New("too many waypoints")
	ErrWaypointNotFound       = errors.New("waypoint not found")
	ErrInvalidWaypointInput   = errors.New("invalid waypoint input")
	ErrRouteIDNotFound        = errors.New("route not found")
	ErrRouteHasActiveTrip     = errors.New("cannot modify waypoints: order has active or scheduled trip")
	ErrWaypointLimitExceeded  = errors.New("maximum 10 waypoints per route")
)
