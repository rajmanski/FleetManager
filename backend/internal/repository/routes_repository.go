package repository

import (
	"context"
	"database/sql"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/routes"
)

type RoutesRepository struct {
	queries sqlc.Querier
}

func NewRoutesRepository(queries sqlc.Querier) *RoutesRepository {
	return &RoutesRepository{queries: queries}
}

func (r *RoutesRepository) GetRouteByID(ctx context.Context, routeID int64) (routes.Route, error) {
	row, err := r.queries.GetRouteByID(ctx, int32(routeID))
	if err != nil {
		if err == sql.ErrNoRows {
			return routes.Route{}, routes.ErrRouteIDNotFound
		}
		return routes.Route{}, err
	}
	return routes.Route{
		RouteID:   int64(row.RouteID),
		OrderID:   int64(row.OrderID),
		StartLoc:  nullStrToString(row.StartLocation),
		EndLoc:    nullStrToString(row.EndLocation),
	}, nil
}

func (r *RoutesRepository) HasActiveTripForOrder(ctx context.Context, orderID int64) (bool, error) {
	count, err := r.queries.CountActiveTripsForOrder(ctx, int32(orderID))
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func nullStrToString(n sql.NullString) string {
	if n.Valid {
		return n.String
	}
	return ""
}
