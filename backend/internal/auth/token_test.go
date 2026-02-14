package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestGenerateAndParseAccessToken(t *testing.T) {
	t.Parallel()

	const secret = "test-secret"
	token, err := GenerateAccessToken(123, "Administrator", secret)
	if err != nil {
		t.Fatalf("GenerateAccessToken() unexpected error: %v", err)
	}

	claims, err := ParseAccessToken(token, secret)
	if err != nil {
		t.Fatalf("ParseAccessToken() unexpected error: %v", err)
	}

	if claims.UserID != 123 || claims.Role != "Administrator" {
		t.Fatalf("ParseAccessToken() returned unexpected claims: %+v", claims)
	}
}

func TestParseAccessTokenExpired(t *testing.T) {
	t.Parallel()

	const secret = "test-secret"
	expiredClaims := AccessTokenClaims{
		UserID: 1,
		Role:   "Administrator",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Minute)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &expiredClaims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("SignedString() unexpected error: %v", err)
	}

	if _, err := ParseAccessToken(signed, secret); err == nil {
		t.Fatal("ParseAccessToken() expected error for expired token")
	}
}

func TestGenerateAndParseRefreshToken(t *testing.T) {
	t.Parallel()

	const secret = "test-secret"
	token, err := GenerateRefreshToken(77, "Spedytor", secret)
	if err != nil {
		t.Fatalf("GenerateRefreshToken() unexpected error: %v", err)
	}

	claims, err := ParseRefreshToken(token, secret)
	if err != nil {
		t.Fatalf("ParseRefreshToken() unexpected error: %v", err)
	}

	if claims.UserID != 77 || claims.Role != "Spedytor" || claims.Type != "refresh" {
		t.Fatalf("ParseRefreshToken() returned unexpected claims: %+v", claims)
	}
}

func TestParseRefreshTokenRejectsAccessToken(t *testing.T) {
	t.Parallel()

	const secret = "test-secret"
	accessToken, err := GenerateAccessToken(1, "Administrator", secret)
	if err != nil {
		t.Fatalf("GenerateAccessToken() unexpected error: %v", err)
	}

	if _, err := ParseRefreshToken(accessToken, secret); err == nil {
		t.Fatal("ParseRefreshToken() expected error for non-refresh token")
	}
}
