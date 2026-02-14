package users

import "errors"

var ErrUserNotFound = errors.New("user not found")
var ErrInvalidInput = errors.New("invalid input")
var ErrSelfDeleteForbidden = errors.New("self delete forbidden")
var ErrPasswordChangeForbidden = errors.New("password change forbidden")
var ErrPasswordTooLong = errors.New("password exceeds bcrypt maximum length of 72 bytes")
