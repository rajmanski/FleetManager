package auth

import (
	"errors"
	"time"
)

var ErrInvalidCredentials = errors.New("invalid credentials")
var ErrUserNotFound = errors.New("user not found")
var ErrPasswordTooLong = errors.New("password exceeds bcrypt maximum length of 72 bytes")
var ErrForbidden = errors.New("forbidden")

type AccountLockedError struct {
	Until time.Time
}

func (e *AccountLockedError) Error() string {
	return "account locked"
}

type InvalidCredentialsError struct {
	RemainingAttempts int
}

func (e *InvalidCredentialsError) Error() string {
	return "invalid credentials"
}
