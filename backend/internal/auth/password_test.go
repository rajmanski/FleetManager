package auth

import (
	"errors"
	"strings"
	"testing"
)

func TestHashPasswordAndVerifyPassword(t *testing.T) {
	t.Parallel()

	password := "P@ssw0rd!#2026"

	hashed, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() unexpected error: %v", err)
	}

	if hashed == password {
		t.Fatal("HashPassword() returned plaintext password")
	}

	if err := VerifyPassword(hashed, password); err != nil {
		t.Fatalf("VerifyPassword() expected success, got error: %v", err)
	}
}

func TestVerifyPasswordRejectsInvalidPassword(t *testing.T) {
	t.Parallel()

	hashed, err := HashPassword("correct-password")
	if err != nil {
		t.Fatalf("HashPassword() unexpected error: %v", err)
	}

	if err := VerifyPassword(hashed, "wrong-password"); err == nil {
		t.Fatal("VerifyPassword() expected error for invalid password")
	}
}

func TestHashPasswordSupportsSpecialCharacters(t *testing.T) {
	t.Parallel()

	password := "Spec!@#$%^&*()_+-=[]{};':\",.<>?/\\|`~"

	hashed, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() unexpected error: %v", err)
	}

	if err := VerifyPassword(hashed, password); err != nil {
		t.Fatalf("VerifyPassword() expected success, got error: %v", err)
	}
}

func TestHashPasswordRejectsTooLongPassword(t *testing.T) {
	t.Parallel()

	password := strings.Repeat("a", 73)
	_, err := HashPassword(password)

	if !errors.Is(err, ErrPasswordTooLong) {
		t.Fatalf("HashPassword() expected ErrPasswordTooLong, got: %v", err)
	}
}
