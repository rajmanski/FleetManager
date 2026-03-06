package cargo

import "errors"

var (
	ErrCargoNotFound   = errors.New("cargo not found")
	ErrInvalidInput    = errors.New("invalid input")
	ErrOrderInProgress = errors.New("cannot modify cargo when order is in progress")
)
