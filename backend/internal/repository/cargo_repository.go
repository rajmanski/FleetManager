package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/cargo"
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

func (r *CargoRepository) ListCargoByOrderID(ctx context.Context, orderID int64) ([]cargo.CargoRow, error) {
	rows, err := r.queries.ListCargoByOrderID(ctx, int32(orderID))
	if err != nil {
		return nil, err
	}
	result := make([]cargo.CargoRow, 0, len(rows))
	for _, row := range rows {
		result = append(result, listCargoRowToCargoRow(row))
	}
	return result, nil
}

func (r *CargoRepository) GetCargoByID(ctx context.Context, cargoID int64) (cargo.CargoRow, bool, error) {
	row, err := r.queries.GetCargoByID(ctx, int32(cargoID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return cargo.CargoRow{}, false, nil
		}
		return cargo.CargoRow{}, false, err
	}
	return getCargoRowToCargoRow(row), true, nil
}

func (r *CargoRepository) CreateCargo(ctx context.Context, orderID int64, description string, weightKg, volumeM3 float64, cargoType string) (int64, error) {
	return r.queries.CreateCargo(ctx, sqlc.CreateCargoParams{
		OrderID:     int32(orderID),
		Description: toNullStringCargo(description),
		WeightKg:    sql.NullString{String: fmt.Sprintf("%.2f", weightKg), Valid: true},
		VolumeM3:    sql.NullString{String: fmt.Sprintf("%.2f", volumeM3), Valid: true},
		CargoType:   toNullCargoType(cargoType),
	})
}

func (r *CargoRepository) UpdateCargo(ctx context.Context, cargoID int64, description string, weightKg, volumeM3 float64, cargoType string) (int64, error) {
	return r.queries.UpdateCargo(ctx, sqlc.UpdateCargoParams{
		Description: toNullStringCargo(description),
		WeightKg:    sql.NullString{String: fmt.Sprintf("%.2f", weightKg), Valid: true},
		VolumeM3:    sql.NullString{String: fmt.Sprintf("%.2f", volumeM3), Valid: true},
		CargoType:   toNullCargoType(cargoType),
		CargoID:     int32(cargoID),
	})
}

func (r *CargoRepository) DeleteCargo(ctx context.Context, cargoID int64) (int64, error) {
	return r.queries.DeleteCargo(ctx, int32(cargoID))
}

func (r *CargoRepository) AssignCargoWaypoint(ctx context.Context, cargoID int64, waypointID *int64) (int64, error) {
	var wpID sql.NullInt32
	if waypointID != nil && *waypointID > 0 {
		wpID = sql.NullInt32{Int32: int32(*waypointID), Valid: true}
	}
	return r.queries.AssignCargoWaypoint(ctx, sqlc.AssignCargoWaypointParams{
		DestinationWaypointID: wpID,
		CargoID:               int32(cargoID),
	})
}

func (r *CargoRepository) GetOrderStatusByCargoID(ctx context.Context, cargoID int64) (string, error) {
	ns, err := r.queries.GetOrderStatusByCargoID(ctx, int32(cargoID))
	if err != nil {
		return "", err
	}
	if !ns.Valid {
		return "", nil
	}
	return string(ns.OrdersStatus), nil
}

func (r *CargoRepository) WaypointBelongsToCargoOrder(ctx context.Context, cargoID int64, waypointID int64) (bool, error) {
	return r.queries.WaypointBelongsToCargoOrder(ctx, sqlc.WaypointBelongsToCargoOrderParams{
		CargoID:    int32(cargoID),
		WaypointID: int32(waypointID),
	})
}

func (r *CargoRepository) SumCargoWeightByOrderID(ctx context.Context, orderID int64) (float64, error) {
	val, err := r.queries.SumCargoWeightByOrderID(ctx, int32(orderID))
	if err != nil {
		return 0, err
	}
	switch v := val.(type) {
	case float64:
		return v, nil
	case []byte:
		return strconv.ParseFloat(string(v), 64)
	default:
		return strconv.ParseFloat(fmt.Sprintf("%v", v), 64)
	}
}

func listCargoRowToCargoRow(row sqlc.ListCargoByOrderIDRow) cargo.CargoRow {
	return cargoRowFromFields(
		int64(row.CargoID),
		int64(row.OrderID),
		row.DestinationWaypointID,
		row.Description,
		row.WeightKg,
		row.VolumeM3,
		row.CargoType,
	)
}

func getCargoRowToCargoRow(row sqlc.GetCargoByIDRow) cargo.CargoRow {
	return cargoRowFromFields(
		int64(row.CargoID),
		int64(row.OrderID),
		row.DestinationWaypointID,
		row.Description,
		row.WeightKg,
		row.VolumeM3,
		row.CargoType,
	)
}

func cargoRowFromFields(
	cargoID, orderID int64,
	destWp sql.NullInt32,
	desc sql.NullString,
	weightKg, volumeM3 sql.NullString,
	cargoType sqlc.NullCargoCargoType,
) cargo.CargoRow {
	row := cargo.CargoRow{
		ID:        cargoID,
		OrderID:   orderID,
		CargoType: string(cargoType.CargoCargoType),
	}
	if destWp.Valid {
		id := int64(destWp.Int32)
		row.DestinationWaypointID = &id
	}
	if desc.Valid {
		row.Description = desc.String
	}
	if weightKg.Valid {
		if f, err := strconv.ParseFloat(weightKg.String, 64); err == nil {
			row.WeightKg = f
		}
	}
	if volumeM3.Valid {
		if f, err := strconv.ParseFloat(volumeM3.String, 64); err == nil {
			row.VolumeM3 = f
		}
	}
	return row
}

func toNullStringCargo(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}

func toNullCargoType(s string) sqlc.NullCargoCargoType {
	switch s {
	case "General", "Refrigerated", "Hazardous":
		return sqlc.NullCargoCargoType{CargoCargoType: sqlc.CargoCargoType(s), Valid: true}
	}
	return sqlc.NullCargoCargoType{CargoCargoType: sqlc.CargoCargoTypeGeneral, Valid: true}
}
