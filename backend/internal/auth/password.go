package auth

import "golang.org/x/crypto/bcrypt"

const (
	bcryptMinCost    = 10
	maxPasswordBytes = 72
)

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
