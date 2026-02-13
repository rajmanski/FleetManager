package auth

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

const (
	// bcryptMinCost is the project baseline required by task E1.2.
	bcryptMinCost = 10
	maxPasswordBytes = 72
)

var ErrPasswordTooLong = errors.New("password exceeds bcrypt maximum length of 72 bytes")

func HashPassword(plainPassword string) (string, error) {
	if len([]byte(plainPassword)) > maxPasswordBytes {
		return "", ErrPasswordTooLong
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcryptMinCost)
	if err != nil {
		return "", err
	}

	return string(hashed), nil
}

func VerifyPassword(hashedPassword, plainPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
}
