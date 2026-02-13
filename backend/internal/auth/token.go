package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const AccessTokenTTL = 24 * time.Hour

func GenerateAccessToken(userID int64, role, secret string) (string, error) {
	claims := jwt.MapClaims{
		"userID": userID,
		"role":   role,
		"exp":    time.Now().Add(AccessTokenTTL).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
