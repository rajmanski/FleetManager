package assignments

import "errors"

var (
	ErrInvalidInput       = errors.New("invalid input")
	ErrAssignmentNotFound = errors.New("assignment not found")
	ErrDriverOverlap      = errors.New("driver already has overlapping assignment")
	ErrAssignedFromPast   = errors.New("assigned_from cannot be more than 30 days in the past")
	ErrVehicleNotFound    = errors.New("vehicle not found")
	ErrDriverNotFound     = errors.New("driver not found")
)
