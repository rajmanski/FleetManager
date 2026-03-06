package cargo

import "errors"

var (
	ErrCargoNotFound            = errors.New("cargo not found")
	ErrInvalidInput             = errors.New("invalid input")
	ErrOrderInProgress          = errors.New("cannot modify cargo when order is in progress")
	ErrWaypointNotInOrderRoute  = errors.New("waypoint does not belong to this order's route")
)
