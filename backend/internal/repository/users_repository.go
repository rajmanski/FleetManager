package repository

import (
	"context"
	"database/sql"
	"errors"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/users"
)

type UsersRepository struct {
	queries sqlc.Querier
}

func NewUsersRepository(queries sqlc.Querier) *UsersRepository {
	return &UsersRepository{queries: queries}
}

func (r *UsersRepository) UnlockUserAccount(ctx context.Context, userID int64) error {
	rows, err := r.queries.UnlockUserAccount(ctx, int32(userID))
	if err != nil {
		return err
	}
	if rows == 0 {
		return users.ErrUserNotFound
	}
	return nil
}

func (r *UsersRepository) ListAdminUsers(ctx context.Context) ([]users.AdminUser, error) {
	rows, err := r.queries.ListAdminUsers(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]users.AdminUser, 0, len(rows))
	for _, row := range rows {
		user := users.AdminUser{
			ID:       int64(row.UserID),
			Login:    row.Username,
			Email:    row.Email,
			Role:     row.RoleName,
			IsActive: row.IsActive.Valid && row.IsActive.Bool,
		}
		if row.CreatedAt.Valid {
			createdAt := row.CreatedAt.Time
			user.CreatedAt = &createdAt
		}
		result = append(result, user)
	}
	return result, nil
}

func (r *UsersRepository) GetAdminUserByID(ctx context.Context, userID int64) (users.AdminUser, error) {
	row, err := r.queries.GetAdminUserByID(ctx, int32(userID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return users.AdminUser{}, users.ErrUserNotFound
		}
		return users.AdminUser{}, err
	}

	user := users.AdminUser{
		ID:       int64(row.UserID),
		Login:    row.Username,
		Email:    row.Email,
		Role:     row.RoleName,
		IsActive: row.IsActive.Valid && row.IsActive.Bool,
	}
	if row.CreatedAt.Valid {
		createdAt := row.CreatedAt.Time
		user.CreatedAt = &createdAt
	}
	return user, nil
}

func (r *UsersRepository) CreateAdminUser(ctx context.Context, input users.CreateAdminUserRequest) (int64, error) {
	roleID, err := r.queries.GetRoleIDByName(ctx, input.Role)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, users.ErrInvalidInput
		}
		return 0, err
	}

	id, err := r.queries.CreateAdminUser(ctx, sqlc.CreateAdminUserParams{
		RoleID:       roleID,
		Username:     input.Login,
		PasswordHash: input.Password,
		Email:        input.Email,
	})
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *UsersRepository) UpdateAdminUser(ctx context.Context, userID int64, input users.UpdateAdminUserRequest) error {
	roleID, err := r.queries.GetRoleIDByName(ctx, input.Role)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return users.ErrInvalidInput
		}
		return err
	}

	rows, err := r.queries.UpdateAdminUser(ctx, sqlc.UpdateAdminUserParams{
		RoleID:   roleID,
		Username: input.Login,
		Email:    input.Email,
		UserID:   int32(userID),
	})
	if err != nil {
		return err
	}
	if rows == 0 {
		return users.ErrUserNotFound
	}
	return nil
}

func (r *UsersRepository) SoftDeleteAdminUser(ctx context.Context, userID int64) error {
	rows, err := r.queries.SoftDeleteAdminUser(ctx, int32(userID))
	if err != nil {
		return err
	}
	if rows == 0 {
		return users.ErrUserNotFound
	}
	return nil
}
