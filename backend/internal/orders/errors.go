package orders

import "errors"

var (
	ErrInvalidInput      = errors.New("invalid input")
	ErrOrderNotFound     = errors.New("order not found")
	ErrOrderNumberExists = errors.New("order number already exists")
)
