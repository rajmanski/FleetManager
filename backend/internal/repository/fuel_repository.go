package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

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

	_ = alert

	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return fuelLogID, nil
}

func (r *FuelRepository) ListFuelLogs(ctx context.Context, query fuel.ListFuelLogsQuery) ([]fuel.FuelLog, int64, error) {
	offset := (query.Page - 1) * query.Limit

	vehicleFilter := interface{}(0)
	vehicleID := int32(0)
	if query.VehicleID > 0 {
		vehicleFilter = 1
		vehicleID = int32(query.VehicleID)
	}

	dateFromStr := strings.TrimSpace(query.DateFrom)
	dateToStr := strings.TrimSpace(query.DateTo)

	var dateFrom time.Time
	var dateTo time.Time
	dateFromColumn := interface{}("")
	dateToColumn := interface{}("")

	if dateFromStr != "" {
		t, err := time.Parse("2006-01-02", dateFromStr)
		if err != nil {
			return nil, 0, fuel.ErrInvalidInput
		}
		dateFrom = t
		dateFromColumn = dateFromStr
	}
	if dateToStr != "" {
		t, err := time.Parse("2006-01-02", dateToStr)
		if err != nil {
			return nil, 0, fuel.ErrInvalidInput
		}
		dateTo = t
		dateToColumn = dateToStr
	}

	rows, err := r.queries.ListFuelLog(ctx, sqlc.ListFuelLogParams{
		Column1: vehicleFilter,
		VehicleID: vehicleID,
		Column3: dateFromColumn,
		Date:    dateFrom,
		Column5: dateToColumn,
		Date_2:  dateTo,
		Limit:   query.Limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountFuelLog(ctx, sqlc.CountFuelLogParams{
		Column1: vehicleFilter,
		VehicleID: vehicleID,
		Column3: dateFromColumn,
		Date:    dateFrom,
		Column5: dateToColumn,
		Date_2:  dateTo,
	})
	if err != nil {
		return nil, 0, err
	}

	out := make([]fuel.FuelLog, 0, len(rows))
	for _, row := range rows {
		out = append(out, mapFuelLogRow(row))
	}
	return out, total, nil
}

func mapFuelLogRow(row sqlc.ListFuelLogRow) fuel.FuelLog {
	var liters float64
	_, _ = fmt.Sscanf(row.Liters, "%f", &liters)

	var pricePerLiter float64
	_, _ = fmt.Sscanf(row.PricePerLiter, "%f", &pricePerLiter)

	var totalCost float64
	if row.TotalCost != "" {
		_, _ = fmt.Sscanf(row.TotalCost, "%f", &totalCost)
	}

	var createdAt *time.Time
	if row.CreatedAt.Valid {
		t := row.CreatedAt.Time
		createdAt = &t
	}

	return fuel.FuelLog{
		ID:             int64(row.ID),
		VehicleID:     int64(row.VehicleID),
		Date:          row.Date,
		Liters:        liters,
		PricePerLiter: pricePerLiter,
		TotalCost:     totalCost,
		Mileage:       int64(row.Mileage),
		Location:      row.Location,
		CreatedAt:     createdAt,
		HasAlert:      row.HasAlert,
		IsAnomaly:      row.IsAnomaly,
		ConsumptionPer100km:    row.ConsumptionPer100km,
		AvgConsumptionPer100km: row.AvgConsumptionPer100km,
		DeviationPercent:       row.DeviationPercent,
	}
}

var _ fuel.Repository = (*FuelRepository)(nil)
