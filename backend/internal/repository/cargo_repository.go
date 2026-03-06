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
		result = append(result, sqlcCargoToRow(row))
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
	return sqlcCargoToRow(row), true, nil
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

func sqlcCargoToRow(c sqlc.Cargo) cargo.CargoRow {
	row := cargo.CargoRow{
		ID:        int64(c.CargoID),
		OrderID:   int64(c.OrderID),
		CargoType: string(c.CargoType.CargoCargoType),
	}
	if c.Description.Valid {
		row.Description = c.Description.String
	}
	if c.WeightKg.Valid {
		if f, err := strconv.ParseFloat(c.WeightKg.String, 64); err == nil {
			row.WeightKg = f
		}
	}
	if c.VolumeM3.Valid {
		if f, err := strconv.ParseFloat(c.VolumeM3.String, 64); err == nil {
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
