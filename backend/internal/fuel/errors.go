package fuel

import "errors"

var (
	ErrInvalidInput      = errors.New("invalid input")
	ErrVehicleNotFound   = errors.New("vehicle not found")
	ErrMileageNotUpdated = errors.New("mileage must be updated to reflect the current odometer reading")
)

