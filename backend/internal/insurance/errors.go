package insurance

import "errors"

var (
	ErrInvalidInput       = errors.New("invalid input")
	ErrInvalidPolicyType  = errors.New("invalid insurance policy type")
	ErrPolicyNotFound     = errors.New("insurance policy not found")
	ErrInvalidDateRange   = errors.New("end date must be on or after start date")
)
