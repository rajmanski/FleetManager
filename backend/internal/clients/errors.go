package clients

import "errors"

var (
	ErrInvalidInput      = errors.New("invalid input")
	ErrClientNotFound    = errors.New("client not found")
	ErrClientNIPConflict = errors.New("client nip conflict")
	ErrClientRestoreConflict = errors.New("client restore conflict")
)

