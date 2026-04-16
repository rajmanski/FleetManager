package gdpr

import (
	"context"
	"database/sql"
)

type Repository interface {
	ForgetDriver(ctx context.Context, driverID int64) error
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ForgetDriver(ctx context.Context, driverID int64) error {
	if driverID <= 0 {
		return ErrInvalidInput
	}
	err := s.repo.ForgetDriver(ctx, driverID)
	if err != nil {
		if err == sql.ErrNoRows {
			return ErrDriverNotFound
		}
	}
	return err
}
