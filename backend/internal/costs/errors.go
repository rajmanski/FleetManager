package costs

import "errors"

var (
	ErrInvalidInput    = errors.New("invalid input")
	ErrInvalidCategory = errors.New("invalid cost category")
	ErrCostNotFound    = errors.New("cost not found")
)
