package maintenance

import "errors"

var (
	ErrInvalidInput      = errors.New("invalid input")
	ErrInvalidType       = errors.New("invalid maintenance type")
	ErrInvalidStatus     = errors.New("invalid maintenance status")
	ErrMaintenanceNotFound = errors.New("maintenance not found")
)

