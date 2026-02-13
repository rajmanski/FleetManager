package auth

import (
	"context"
	"errors"
	"strings"
	"time"
)

const accountLockDuration = 30 * time.Minute

type Service struct {
	repo      Repository
	jwtSecret string
}

func NewService(repo Repository, jwtSecret string) *Service {
	return &Service{
		repo:      repo,
		jwtSecret: jwtSecret,
	}
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (LoginResponse, error) {
	login := strings.TrimSpace(strings.ToLower(req.Login))
	password := req.Password
	if login == "" || password == "" {
		return LoginResponse{}, ErrInvalidCredentials
	}

	user, err := s.repo.GetUserByLogin(ctx, login)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return LoginResponse{}, ErrInvalidCredentials
		}
		return LoginResponse{}, err
	}

	now := time.Now()
	if user.LockedUntil != nil && user.LockedUntil.After(now) {
		return LoginResponse{}, &AccountLockedError{Until: *user.LockedUntil}
	}

	if user.LockedUntil != nil && !user.LockedUntil.After(now) {
		if err := s.repo.UpdateLoginState(ctx, user.ID, 0, nil); err != nil {
			return LoginResponse{}, err
		}
		user.FailedLoginAttempt = 0
		user.LockedUntil = nil
	}

	if err := VerifyPassword(user.PasswordHash, password); err != nil {
		failedAttempts := user.FailedLoginAttempt + 1
		var lockUntil *time.Time
		if failedAttempts >= 3 {
			until := now.Add(accountLockDuration)
			lockUntil = &until
		}

		if err := s.repo.UpdateLoginState(ctx, user.ID, failedAttempts, lockUntil); err != nil {
			return LoginResponse{}, err
		}

		if lockUntil != nil {
			return LoginResponse{}, &AccountLockedError{Until: *lockUntil}
		}
		return LoginResponse{}, ErrInvalidCredentials
	}

	if err := s.repo.UpdateLoginState(ctx, user.ID, 0, nil); err != nil {
		return LoginResponse{}, err
	}

	token, err := GenerateAccessToken(user.ID, user.Role, s.jwtSecret)
	if err != nil {
		return LoginResponse{}, err
	}

	return LoginResponse{
		Token: token,
		User: LoginUser{
			ID:    user.ID,
			Login: user.Login,
			Role:  user.Role,
		},
	}, nil
}
