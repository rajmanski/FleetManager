package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"fleet-management/internal/auth"
	sqlc "fleet-management/internal/db/sqlc"
)

type AuthRepository struct {
	queries sqlc.Querier
}

func NewAuthRepository(queries sqlc.Querier) *AuthRepository {
	return &AuthRepository{queries: queries}
}

func (r *AuthRepository) GetUserByLogin(ctx context.Context, login string) (auth.User, error) {
	row, err := r.queries.GetUserByLogin(ctx, login)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return auth.User{}, auth.ErrUserNotFound
		}
		return auth.User{}, err
	}

	user := auth.User{
		ID:                 int64(row.UserID),
		Login:              row.Username,
		Role:               row.RoleName,
		PasswordHash:       row.PasswordHash,
		FailedLoginAttempt: int(row.FailedLoginAttempts.Int32),
	}
	if row.LockedUntil.Valid {
		lockedUntil := row.LockedUntil.Time
		user.LockedUntil = &lockedUntil
	}

	return user, nil
}

func (r *AuthRepository) UpdateLoginState(ctx context.Context, userID int64, failedAttempts int, lockedUntil *time.Time) error {
	lockUntilValue := sql.NullTime{}
	if lockedUntil != nil {
		lockUntilValue = sql.NullTime{
			Time:  *lockedUntil,
			Valid: true,
		}
	}

	return r.queries.UpdateUserLoginState(ctx, sqlc.UpdateUserLoginStateParams{
		FailedLoginAttempts: sql.NullInt32{
			Int32: int32(failedAttempts),
			Valid: true,
		},
		LockedUntil: lockUntilValue,
		UserID:      int32(userID),
	})
}

func (r *AuthRepository) UnlockUserAccount(ctx context.Context, userID int64) error {
	rows, err := r.queries.UnlockUserAccount(ctx, int32(userID))
	if err != nil {
		return err
	}
	if rows == 0 {
		return auth.ErrUserNotFound
	}
	return nil
}
