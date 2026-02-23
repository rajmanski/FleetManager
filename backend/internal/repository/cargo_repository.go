package repository

import (
	"context"

	sqlc "fleet-management/internal/db/sqlc"
)

type CargoRepository struct {
	queries sqlc.Querier
}

func NewCargoRepository(queries sqlc.Querier) *CargoRepository {
	return &CargoRepository{queries: queries}
}

func (r *CargoRepository) OrderHasHazardousCargo(ctx context.Context, orderID int64) (bool, error) {
	return r.queries.OrderHasHazardousCargo(ctx, int32(orderID))
}
