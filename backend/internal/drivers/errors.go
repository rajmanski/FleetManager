package drivers

import "errors"

var (
	ErrInvalidInput          = errors.New("invalid input")
	ErrInvalidPESEL          = errors.New("invalid pesel")
	ErrInvalidStatus         = errors.New("invalid status")
	ErrDriverNotFound        = errors.New("driver not found")
	ErrDriverPESELConflict   = errors.New("driver pesel conflict")
	ErrDriverRestoreConflict = errors.New("driver restore conflict")
	ErrDriverHasActiveTrips  = errors.New("driver has active trips")
)
