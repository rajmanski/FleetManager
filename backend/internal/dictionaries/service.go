package dictionaries

import (
	"context"
	"strings"
	"unicode/utf8"
)

const (
	maxCategoryLen = 64
	maxKeyLen      = 128
	maxValueLen    = 500
)

type Repository interface {
	ListByCategory(ctx context.Context, category string) ([]Entry, error)
	GetByID(ctx context.Context, id int64) (Entry, error)
	Create(ctx context.Context, in CreateRequest) (Entry, error)
	Update(ctx context.Context, id int64, in UpdateRequest) (Entry, error)
	Delete(ctx context.Context, id int64) error
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListByCategory(ctx context.Context, category string) ([]Entry, error) {
	category = strings.TrimSpace(category)
	if category == "" || utf8.RuneCountInString(category) > maxCategoryLen {
		return nil, ErrInvalidInput
	}
	return s.repo.ListByCategory(ctx, category)
}

func (s *Service) Create(ctx context.Context, in CreateRequest) (Entry, error) {
	if err := validateCreate(in); err != nil {
		return Entry{}, err
	}
	return s.repo.Create(ctx, in)
}

func (s *Service) Update(ctx context.Context, id int64, in UpdateRequest) (Entry, error) {
	if id <= 0 {
		return Entry{}, ErrInvalidInput
	}
	if err := validateUpdate(in); err != nil {
		return Entry{}, err
	}
	return s.repo.Update(ctx, id, in)
}

func (s *Service) Delete(ctx context.Context, id int64) error {
	if id <= 0 {
		return ErrInvalidInput
	}
	return s.repo.Delete(ctx, id)
}

func validateCreate(in CreateRequest) error {
	cat := strings.TrimSpace(in.Category)
	key := strings.TrimSpace(in.Key)
	val := strings.TrimSpace(in.Value)
	if cat == "" || key == "" || val == "" {
		return ErrInvalidInput
	}
	if utf8.RuneCountInString(cat) > maxCategoryLen || utf8.RuneCountInString(key) > maxKeyLen || utf8.RuneCountInString(val) > maxValueLen {
		return ErrInvalidInput
	}
	return nil
}

func validateUpdate(in UpdateRequest) error {
	cat := strings.TrimSpace(in.Category)
	key := strings.TrimSpace(in.Key)
	val := strings.TrimSpace(in.Value)
	if cat == "" || key == "" || val == "" {
		return ErrInvalidInput
	}
	if utf8.RuneCountInString(cat) > maxCategoryLen || utf8.RuneCountInString(key) > maxKeyLen || utf8.RuneCountInString(val) > maxValueLen {
		return ErrInvalidInput
	}
	return nil
}
