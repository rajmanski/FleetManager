package drivers

import "errors"

var (
	ErrInvalidInput          = errors.New("invalid input")
	ErrInvalidPESEL          = errors.New("invalid pesel")
	ErrInvalidStatus         = errors.New("invalid status")
	ErrInvalidCertificates   = errors.New("adr_expiry_date can only be set when adr_certified is true")
	ErrDriverNotFound        = errors.New("driver not found")
	ErrDriverPESELConflict   = errors.New("driver pesel conflict")
	ErrDriverRestoreConflict = errors.New("driver restore conflict")
	ErrDriverHasActiveTrips  = errors.New("driver has active trips")
)
