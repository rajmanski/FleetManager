package users

import "context"

type Repository interface {
	UnlockUserAccount(ctx context.Context, userID int64) error
	ListAdminUsers(ctx context.Context) ([]AdminUser, error)
	GetAdminUserByID(ctx context.Context, userID int64) (AdminUser, error)
	CreateAdminUser(ctx context.Context, input CreateAdminUserRequest) (int64, error)
	UpdateAdminUser(ctx context.Context, userID int64, input UpdateAdminUserRequest) error
	SoftDeleteAdminUser(ctx context.Context, userID int64) error
}
