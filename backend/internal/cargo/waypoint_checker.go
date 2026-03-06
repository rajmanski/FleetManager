package cargo

import (
	"context"
	"database/sql"
	"errors"

	sqlc "fleet-management/internal/db/sqlc"
)
type WaypointRouteCheckerImpl struct {
	queries sqlc.Querier
}

func NewWaypointRouteChecker(queries sqlc.Querier) *WaypointRouteCheckerImpl {
	return &WaypointRouteCheckerImpl{queries: queries}
}

func (c *WaypointRouteCheckerImpl) WaypointBelongsToOrderRoute(ctx context.Context, waypointID int64, orderID int64) (bool, error) {
	routeID, err := c.queries.GetWaypointRouteID(ctx, int32(waypointID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	route, err := c.queries.GetRouteByID(ctx, routeID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return int64(route.OrderID) == orderID, nil
}
