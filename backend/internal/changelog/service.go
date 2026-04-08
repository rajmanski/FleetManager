package changelog

import "context"

const (
	defaultListPage  int32 = 1
	defaultListLimit int32 = 50
	maxListLimit     int32 = 100
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, query ListChangelogQuery) (ListChangelogResponse, error) {
	page := query.Page
	limit := query.Limit
	if page <= 0 {
		page = defaultListPage
	}
	if limit <= 0 {
		limit = defaultListLimit
	}
	if limit > maxListLimit {
		return ListChangelogResponse{}, ErrInvalidInput
	}
	if query.UserID < 0 {
		return ListChangelogResponse{}, ErrInvalidInput
	}

	rows, total, err := s.repo.List(ctx, ListChangelogQuery{
		UserID:    query.UserID,
		TableName: query.TableName,
		Operation: query.Operation,
		DateFrom:  query.DateFrom,
		DateTo:    query.DateTo,
		Page:      page,
		Limit:     limit,
	})
	if err != nil {
		return ListChangelogResponse{}, err
	}

	return ListChangelogResponse{
		Data:  rows,
		Page:  page,
		Limit: limit,
		Total: total,
	}, nil
}
