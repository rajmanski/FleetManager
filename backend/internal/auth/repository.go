package auth

import (
	"context"
	"time"
)

type Repository interface {
	GetUserByLogin(ctx context.Context, login string) (User, error)
	UpdateLoginState(ctx context.Context, userID int64, failedAttempts int, lockedUntil *time.Time) error
}
