package costs

import "context"

type Repository interface {
	ListCosts(ctx context.Context, query ListCostsQuery) ([]Cost, int64, error)
	GetCostByID(ctx context.Context, id int64) (Cost, error)
	CreateCost(ctx context.Context, input CreateCostRequest) (int64, error)
	UpdateCost(ctx context.Context, id int64, input UpdateCostRequest) error
	DeleteCost(ctx context.Context, id int64) error
}
