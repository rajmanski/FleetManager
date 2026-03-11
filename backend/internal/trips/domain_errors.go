package trips

import "errors"

var (
	ErrInvalidInput     = errors.New("invalid input")
	ErrTripNotFound     = errors.New("trip not found")
	ErrInvalidState     = errors.New("invalid trip state")
	ErrValidationFailed = errors.New("validation failed")
)

