package auth

import (
	"errors"
	"time"
)

var ErrInvalidCredentials = errors.New("invalid credentials")
var ErrUserNotFound = errors.New("user not found")
var ErrPasswordTooLong = errors.New("password exceeds bcrypt maximum length of 72 bytes")

type AccountLockedError struct {
	Until time.Time
}

func (e *AccountLockedError) Error() string {
	return "account locked"
}
