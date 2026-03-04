package orders

import (
	"context"
	"strings"
)

const (
	defaultListPage  int32 = 1
	defaultListLimit int32 = 50
	maxListLimit     int32 = 100
)

var allowedStatuses = map[string]bool{
	"New": true, "Planned": true, "InProgress": true, "Completed": true, "Cancelled": true,
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListOrders(ctx context.Context, query ListOrdersQuery) (ListOrdersResponse, error) {
	page := query.Page
	limit := query.Limit
	if page <= 0 {
		page = defaultListPage
	}
	if limit <= 0 {
		limit = defaultListLimit
	}
	if limit > maxListLimit {
		return ListOrdersResponse{}, ErrInvalidInput
	}

	statusFilter := strings.TrimSpace(query.StatusFilter)
	if statusFilter != "" && !allowedStatuses[statusFilter] {
		return ListOrdersResponse{}, ErrInvalidInput
	}
	search := strings.TrimSpace(query.Search)

	rows, total, err := s.repo.ListOrders(ctx, ListOrdersQuery{
		StatusFilter: statusFilter,
		Search:       search,
		Page:         page,
		Limit:        limit,
	})
	if err != nil {
		return ListOrdersResponse{}, err
	}

	return ListOrdersResponse{
		Data:  rows,
		Page:  page,
		Limit: limit,
		Total: total,
	}, nil
}

func (s *Service) GetOrderByID(ctx context.Context, orderID int64) (Order, error) {
	if orderID <= 0 {
		return Order{}, ErrInvalidInput
	}
	return s.repo.GetOrderByID(ctx, orderID)
}

func (s *Service) CreateOrder(ctx context.Context, req CreateOrderRequest) (Order, error) {
	req.OrderNumber = strings.TrimSpace(req.OrderNumber)
	if req.OrderNumber == "" {
		return Order{}, ErrInvalidInput
	}
	if req.ClientID <= 0 {
		return Order{}, ErrInvalidInput
	}

	id, err := s.repo.CreateOrder(ctx, req)
	if err != nil {
		return Order{}, err
	}
	return s.repo.GetOrderByID(ctx, id)
}

func (s *Service) UpdateOrder(ctx context.Context, orderID int64, req UpdateOrderRequest) (Order, error) {
	if orderID <= 0 {
		return Order{}, ErrInvalidInput
	}
	req.OrderNumber = strings.TrimSpace(req.OrderNumber)
	if req.OrderNumber == "" {
		return Order{}, ErrInvalidInput
	}
	if req.ClientID <= 0 {
		return Order{}, ErrInvalidInput
	}

	if err := s.repo.UpdateOrder(ctx, orderID, req); err != nil {
		return Order{}, err
	}
	return s.repo.GetOrderByID(ctx, orderID)
}

func (s *Service) DeleteOrder(ctx context.Context, orderID int64) error {
	if orderID <= 0 {
		return ErrInvalidInput
	}
	return s.repo.CancelOrder(ctx, orderID)
}
