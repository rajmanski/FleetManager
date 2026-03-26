package costs

import (
	"context"
	"strings"
	"time"
)

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

func (s *Service) ListCosts(ctx context.Context, query ListCostsQuery) (ListCostsResponse, error) {
	page := query.Page
	limit := query.Limit
	if page <= 0 {
		page = defaultListPage
	}
	if limit <= 0 {
		limit = defaultListLimit
	}
	if limit > maxListLimit || query.VehicleID < 0 {
		return ListCostsResponse{}, ErrInvalidInput
	}

	rows, total, err := s.repo.ListCosts(ctx, ListCostsQuery{
		VehicleID: query.VehicleID,
		Page:      page,
		Limit:     limit,
	})
	if err != nil {
		return ListCostsResponse{}, err
	}

	return ListCostsResponse{
		Data:  rows,
		Page:  page,
		Limit: limit,
		Total: total,
	}, nil
}

func (s *Service) CreateCost(ctx context.Context, req CreateCostRequest) (Cost, error) {
	payload, err := normalizeCreatePayload(req)
	if err != nil {
		return Cost{}, err
	}

	id, err := s.repo.CreateCost(ctx, payload)
	if err != nil {
		return Cost{}, err
	}
	return s.repo.GetCostByID(ctx, id)
}

func (s *Service) UpdateCost(ctx context.Context, id int64, req UpdateCostRequest) (Cost, error) {
	if id <= 0 {
		return Cost{}, ErrInvalidInput
	}

	payload, err := normalizeUpdatePayload(req)
	if err != nil {
		return Cost{}, err
	}

	if err := s.repo.UpdateCost(ctx, id, payload); err != nil {
		return Cost{}, err
	}
	return s.repo.GetCostByID(ctx, id)
}

func (s *Service) DeleteCost(ctx context.Context, id int64) error {
	if id <= 0 {
		return ErrInvalidInput
	}
	return s.repo.DeleteCost(ctx, id)
}

func normalizeCreatePayload(req CreateCostRequest) (CreateCostRequest, error) {
	if req.VehicleID <= 0 || req.Amount <= 0 {
		return CreateCostRequest{}, ErrInvalidInput
	}
	category := strings.TrimSpace(req.Category)
	if !isValidCategory(category) {
		return CreateCostRequest{}, ErrInvalidCategory
	}
	if _, err := parseDate(req.Date); err != nil {
		return CreateCostRequest{}, ErrInvalidInput
	}

	return CreateCostRequest{
		VehicleID:     req.VehicleID,
		Category:      category,
		Amount:        req.Amount,
		Date:          strings.TrimSpace(req.Date),
		Description:   strings.TrimSpace(req.Description),
		InvoiceNumber: strings.TrimSpace(req.InvoiceNumber),
	}, nil
}

func normalizeUpdatePayload(req UpdateCostRequest) (UpdateCostRequest, error) {
	if req.VehicleID <= 0 || req.Amount <= 0 {
		return UpdateCostRequest{}, ErrInvalidInput
	}
	category := strings.TrimSpace(req.Category)
	if !isValidCategory(category) {
		return UpdateCostRequest{}, ErrInvalidCategory
	}
	if _, err := parseDate(req.Date); err != nil {
		return UpdateCostRequest{}, ErrInvalidInput
	}

	return UpdateCostRequest{
		VehicleID:     req.VehicleID,
		Category:      category,
		Amount:        req.Amount,
		Date:          strings.TrimSpace(req.Date),
		Description:   strings.TrimSpace(req.Description),
		InvoiceNumber: strings.TrimSpace(req.InvoiceNumber),
	}, nil
}

func isValidCategory(category string) bool {
	switch strings.TrimSpace(category) {
	case "Tolls", "Other":
		return true
	default:
		return false
	}
}

func parseDate(date string) (time.Time, error) {
	return time.Parse("2006-01-02", strings.TrimSpace(date))
}
