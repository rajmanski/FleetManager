package users

import (
	"context"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

const maxPasswordBytes = 72

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) UnlockUserAccount(ctx context.Context, targetUserID int64) error {
	if targetUserID <= 0 {
		return ErrInvalidInput
	}
	return s.repo.UnlockUserAccount(ctx, targetUserID)
}

func (s *Service) ListAdminUsers(ctx context.Context) ([]AdminUser, error) {
	return s.repo.ListAdminUsers(ctx)
}

func (s *Service) GetAdminUserByID(ctx context.Context, userID int64) (AdminUser, error) {
	if userID <= 0 {
		return AdminUser{}, ErrInvalidInput
	}
	return s.repo.GetAdminUserByID(ctx, userID)
}

func (s *Service) CreateAdminUser(ctx context.Context, req CreateAdminUserRequest) (AdminUser, error) {
	login := strings.TrimSpace(strings.ToLower(req.Login))
	email := strings.TrimSpace(req.Email)
	role := strings.TrimSpace(req.Role)
	password := req.Password
	if login == "" || email == "" || role == "" || password == "" {
		return AdminUser{}, ErrInvalidInput
	}

	passwordHash, err := hashPassword(password)
	if err != nil {
		return AdminUser{}, err
	}

	id, err := s.repo.CreateAdminUser(ctx, CreateAdminUserRequest{
		Login:    login,
		Password: passwordHash,
		Email:    email,
		Role:     role,
	})
	if err != nil {
		return AdminUser{}, err
	}

	return s.repo.GetAdminUserByID(ctx, id)
}

func (s *Service) UpdateAdminUser(ctx context.Context, userID int64, req UpdateAdminUserRequest) (AdminUser, error) {
	if userID <= 0 {
		return AdminUser{}, ErrInvalidInput
	}
	if req.Password != nil {
		return AdminUser{}, ErrPasswordChangeForbidden
	}

	login := strings.TrimSpace(strings.ToLower(req.Login))
	email := strings.TrimSpace(req.Email)
	role := strings.TrimSpace(req.Role)
	if login == "" || email == "" || role == "" {
		return AdminUser{}, ErrInvalidInput
	}

	err := s.repo.UpdateAdminUser(ctx, userID, UpdateAdminUserRequest{
		Login: login,
		Email: email,
		Role:  role,
	})
	if err != nil {
		return AdminUser{}, err
	}

	return s.repo.GetAdminUserByID(ctx, userID)
}

func (s *Service) DeleteAdminUser(ctx context.Context, targetUserID, requesterUserID int64) error {
	if targetUserID <= 0 {
		return ErrInvalidInput
	}
	if targetUserID == requesterUserID {
		return ErrSelfDeleteForbidden
	}
	return s.repo.SoftDeleteAdminUser(ctx, targetUserID)
}

func hashPassword(plainPassword string) (string, error) {
	if len([]byte(plainPassword)) > maxPasswordBytes {
		return "", ErrPasswordTooLong
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}
