package dictionaries

import "errors"

var (
	ErrInvalidInput = errors.New("invalid input")
	ErrNotFound     = errors.New("not found")
	ErrDuplicate    = errors.New("duplicate category and key")
)
