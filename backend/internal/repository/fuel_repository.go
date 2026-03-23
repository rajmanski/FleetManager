package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/fuel"
)

type FuelRepository struct {
	db      *sql.DB
	queries *sqlc.Queries
}

func NewFuelRepository(db *sql.DB) *FuelRepository {
	return &FuelRepository{
		db:      db,
		queries: sqlc.New(db),
	}
}

func (r *FuelRepository) GetVehicleCurrentMileage(ctx context.Context, vehicleID int64) (int64, error) {
	row, err := r.queries.GetVehicleCurrentMileage(ctx, int32(vehicleID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, fuel.ErrVehicleNotFound
		}
		return 0, err
	}
	if !row.Valid {
		return 0, fuel.ErrVehicleNotFound
	}
	return int64(row.Int32), nil
}

func (r *FuelRepository) GetAvgFuelConsumptionPer100Km(ctx context.Context, vehicleID int64) (*float64, error) {
	avgAny, err := r.queries.GetAvgFuelConsumptionPer100Km(ctx, int32(vehicleID))
	if err != nil {
		return nil, err
	}
	if avgAny == nil {
		return nil, nil
	}

	switch v := avgAny.(type) {
	case float64:
		if v <= 0 {
			return nil, nil
		}
		return &v, nil
	case int64:
		f := float64(v)
		if f <= 0 {
			return nil, nil
		}
		return &f, nil
	case string:
		f, parseErr := strconv.ParseFloat(v, 64)
		if parseErr != nil {
			return nil, parseErr
		}
		if f <= 0 {
			return nil, nil
		}
		return &f, nil
	case []byte:
		f, parseErr := strconv.ParseFloat(string(v), 64)
		if parseErr != nil {
			return nil, parseErr
		}
		if f <= 0 {
			return nil, nil
		}
		return &f, nil
	default:
		return nil, fmt.Errorf("unexpected avg type: %T", avgAny)
	}
}

func (r *FuelRepository) CreateFuelLogAndUpdate(
	ctx context.Context,
	input fuel.CreateFuelRepositoryInput,
	alert *fuel.CreateFuelAlertInput,
) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer func() { _ = tx.Rollback() }()

	qtx := sqlc.New(tx)

	if input.Mileage < 0 || input.Mileage > int64(^uint32(0)) {
		return 0, fuel.ErrInvalidInput
	}
	mileageU := uint32(input.Mileage)

	fuelLogID, err := qtx.CreateFuelLog(ctx, sqlc.CreateFuelLogParams{
		VehicleID:     int32(input.VehicleID),
		Date:          input.Date,
		Liters:        fmt.Sprintf("%.2f", input.Liters),
		PricePerLiter: fmt.Sprintf("%.2f", input.PricePerLiter),
		TotalCost:     fmt.Sprintf("%.2f", input.TotalCost),
		Mileage:       mileageU,
		Location:      input.Location,
	})
	if err != nil {
		return 0, err
	}

	affected, err := qtx.UpdateVehicleMileage(ctx, sqlc.UpdateVehicleMileageParams{
		CurrentMileageKm: sql.NullInt32{Int32: int32(input.Mileage), Valid: true},
		VehicleID:        int32(input.VehicleID),
	})
	if err != nil {
		return 0, err
	}
	if affected == 0 {
		return 0, fuel.ErrVehicleNotFound
	}

	if alert != nil {
		if _, err := qtx.CreateAlert(ctx, sqlc.CreateAlertParams{
			VehicleID:  sql.NullInt32{Int32: int32(input.VehicleID), Valid: true},
			AlertType:  alert.AlertType,
			Message:    sql.NullString{String: alert.Message, Valid: true},
		}); err != nil {
			return 0, err
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return fuelLogID, nil
}

