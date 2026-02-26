package repository

import (
	"context"
	"database/sql"
	"strconv"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/routes"
)

type WaypointsRepository struct {
	queries sqlc.Querier
}

func NewWaypointsRepository(queries sqlc.Querier) *WaypointsRepository {
	return &WaypointsRepository{queries: queries}
}

func (r *WaypointsRepository) ListWaypointsByRouteID(ctx context.Context, routeID int64) ([]routes.Waypoint, error) {
	rows, err := r.queries.ListWaypointsByRouteID(ctx, int32(routeID))
	if err != nil {
		return nil, err
	}
	result := make([]routes.Waypoint, 0, len(rows))
	for _, row := range rows {
		result = append(result, mapWaypointRow(row))
	}
	return result, nil
}

func (r *WaypointsRepository) GetWaypointByID(ctx context.Context, waypointID int64) (routes.Waypoint, error) {
	row, err := r.queries.GetWaypointByID(ctx, int32(waypointID))
	if err != nil {
		if err == sql.ErrNoRows {
			return routes.Waypoint{}, routes.ErrWaypointNotFound
		}
		return routes.Waypoint{}, err
	}
	return mapWaypointRow(row), nil
}

func (r *WaypointsRepository) CountWaypointsByRouteID(ctx context.Context, routeID int64) (int64, error) {
	return r.queries.CountWaypointsByRouteID(ctx, int32(routeID))
}

func (r *WaypointsRepository) GetMaxSequenceOrder(ctx context.Context, routeID int64) (int32, error) {
	v, err := r.queries.GetMaxSequenceOrder(ctx, int32(routeID))
	if err != nil {
		return 0, err
	}
	switch n := v.(type) {
	case int64:
		return int32(n), nil
	case int32:
		return n, nil
	case float64:
		return int32(n), nil
	default:
		return 0, nil
	}
}

func (r *WaypointsRepository) CreateWaypoint(ctx context.Context, wp routes.CreateWaypointInput) (int64, error) {
	return r.queries.CreateWaypoint(ctx, sqlc.CreateWaypointParams{
		RouteID:       int32(wp.RouteID),
		SequenceOrder: wp.SequenceOrder,
		Address:       wp.Address,
		Latitude:      formatCoordForDB(wp.Latitude),
		Longitude:     formatCoordForDB(wp.Longitude),
		ActionType:    sqlc.RoutewaypointsActionType(wp.ActionType),
	})
}

func (r *WaypointsRepository) UpdateWaypoint(ctx context.Context, wp routes.UpdateWaypointInput) error {
	_, err := r.queries.UpdateWaypoint(ctx, sqlc.UpdateWaypointParams{
		SequenceOrder: wp.SequenceOrder,
		Address:       wp.Address,
		Latitude:      formatCoordForDB(wp.Latitude),
		Longitude:     formatCoordForDB(wp.Longitude),
		ActionType:    sqlc.RoutewaypointsActionType(wp.ActionType),
		WaypointID:    int32(wp.WaypointID),
	})
	return err
}

func (r *WaypointsRepository) DeleteWaypoint(ctx context.Context, waypointID int64) (deletedSequence int32, err error) {
	wp, err := r.queries.GetWaypointByID(ctx, int32(waypointID))
	if err != nil {
		return 0, err
	}
	_, err = r.queries.DeleteWaypoint(ctx, int32(waypointID))
	if err != nil {
		return 0, err
	}
	err = r.queries.RenumberWaypointsAfterDelete(ctx, sqlc.RenumberWaypointsAfterDeleteParams{
		RouteID:       wp.RouteID,
		SequenceOrder: wp.SequenceOrder,
	})
	if err != nil {
		return wp.SequenceOrder, err
	}
	return wp.SequenceOrder, nil
}

func (r *WaypointsRepository) GetWaypointRouteID(ctx context.Context, waypointID int64) (int64, error) {
	routeID, err := r.queries.GetWaypointRouteID(ctx, int32(waypointID))
	if err != nil {
		return 0, err
	}
	return int64(routeID), nil
}

func (r *WaypointsRepository) ReorderWaypoints(ctx context.Context, routeID int64, updates []routes.WaypointReorderItem) error {
	for _, u := range updates {
		_, err := r.queries.UpdateWaypointSequence(ctx, sqlc.UpdateWaypointSequenceParams{
			SequenceOrder: u.SequenceOrder,
			WaypointID:    int32(u.WaypointID),
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func mapWaypointRow(row sqlc.Routewaypoint) routes.Waypoint {
	lat, _ := strconv.ParseFloat(row.Latitude, 64)
	lng, _ := strconv.ParseFloat(row.Longitude, 64)
	return routes.Waypoint{
		WaypointID:    int64(row.WaypointID),
		RouteID:       int64(row.RouteID),
		SequenceOrder: row.SequenceOrder,
		Address:       row.Address,
		Latitude:      lat,
		Longitude:     lng,
		ActionType:    string(row.ActionType),
	}
}

func formatCoordForDB(v float64) string {
	return strconv.FormatFloat(v, 'f', 7, 64)
}
