package repository

import (
	"context"
	"database/sql"
	"errors"
	"math"
	"strconv"
	"strings"
	"time"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/trips"
)

type TripsRepository struct {
	db      *sql.DB
	queries *sqlc.Queries
}

func NewTripsRepository(db *sql.DB) *TripsRepository {
	return &TripsRepository{
		db:      db,
		queries: sqlc.New(db),
	}
}

func (r *TripsRepository) ListTrips(ctx context.Context, query trips.ListTripsQuery) ([]trips.Trip, error) {
	status := strings.TrimSpace(query.Status)
	statusColumnValue := interface{}(status)
	if status == "" {
		statusColumnValue = ""
	}

	rows, err := r.queries.ListTrips(ctx, sqlc.ListTripsParams{
		Column1: statusColumnValue,
		Status:  toNullTripsStatus(status),
	})
	if err != nil {
		return nil, err
	}

	result := make([]trips.Trip, 0, len(rows))
	for _, row := range rows {
		result = append(result, mapTripRow(row))
	}
	return result, nil
}

func (r *TripsRepository) ListTripsByOrderID(ctx context.Context, orderID int64) ([]trips.Trip, error) {
	rows, err := r.queries.ListTripsByOrderID(ctx, int32(orderID))
	if err != nil {
		return nil, err
	}
	result := make([]trips.Trip, 0, len(rows))
	for _, row := range rows {
		result = append(result, mapTripRow(sqlc.ListTripsRow{
			TripID:            row.TripID,
			OrderID:           row.OrderID,
			OrderNumber:       row.OrderNumber,
			ClientCompany:     row.ClientCompany,
			VehicleID:         row.VehicleID,
			VehicleVin:        row.VehicleVin,
			DriverID:          row.DriverID,
			FirstName:         row.FirstName,
			LastName:          row.LastName,
			PlannedDistanceKm: row.PlannedDistanceKm,
			StartTime:         row.StartTime,
			EndTime:           row.EndTime,
			ActualDistanceKm:  row.ActualDistanceKm,
			Status:            row.Status,
		}))
	}
	return result, nil
}

func (r *TripsRepository) GetTripByID(ctx context.Context, tripID int64) (trips.Trip, error) {
	row, err := r.queries.GetTripByID(ctx, int32(tripID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return trips.Trip{}, trips.ErrTripNotFound
		}
		return trips.Trip{}, err
	}
	return mapGetTripRow(row), nil
}

func (r *TripsRepository) TripExists(ctx context.Context, tripID int64) (bool, error) {
	_, err := r.queries.GetTripStatusByID(ctx, int32(tripID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (r *TripsRepository) GetTripOrderVehicleDriverIDs(ctx context.Context, tripID int64) (orderID, vehicleID, driverID int64, err error) {
	row, err := r.queries.GetTripOrderVehicleDriverIDs(ctx, int32(tripID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, 0, 0, trips.ErrTripNotFound
		}
		return 0, 0, 0, err
	}
	return int64(row.OrderID), int64(row.VehicleID), int64(row.DriverID), nil
}

func (r *TripsRepository) CreateTripAndSetInRoute(ctx context.Context, input trips.CreateTripRequest) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer func() { _ = tx.Rollback() }()

	qtx := sqlc.New(tx)

	tripID, err := qtx.CreateTrip(ctx, sqlc.CreateTripParams{
		OrderID:   int32(input.OrderID),
		VehicleID: int32(input.VehicleID),
		DriverID:  int32(input.DriverID),
		StartTime: sql.NullTime{Time: input.StartTime, Valid: true},
		Status:    toNullTripsStatus("Scheduled"),
	})
	if err != nil {
		return 0, err
	}

	if _, err := qtx.UpdateVehicleStatusByID(ctx, sqlc.UpdateVehicleStatusByIDParams{
		Status:    toNullVehiclesStatus("InRoute"),
		VehicleID: int32(input.VehicleID),
	}); err != nil {
		return 0, err
	}

	if _, err := qtx.UpdateDriverStatusByID(ctx, sqlc.UpdateDriverStatusByIDParams{
		Status:   toNullDriversStatus("InRoute"),
		DriverID: int32(input.DriverID),
	}); err != nil {
		return 0, err
	}

	if _, err := qtx.UpdateOrderStatusByID(ctx, sqlc.UpdateOrderStatusByIDParams{
		Status:  toNullOrdersStatus("Planned"),
		OrderID: int32(input.OrderID),
	}); err != nil {
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return tripID, nil
}

func (r *TripsRepository) StartTripAndSetInRoute(ctx context.Context, tripID int64) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	qtx := sqlc.New(tx)

	ids, err := qtx.GetTripOrderVehicleDriverIDs(ctx, int32(tripID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return trips.ErrTripNotFound
		}
		return err
	}

	rows, err := qtx.UpdateTripStatusStart(ctx, int32(tripID))
	if err != nil {
		return err
	}
	if rows == 0 {
		return trips.ErrInvalidState
	}

	if _, err := qtx.UpdateVehicleStatusByID(ctx, sqlc.UpdateVehicleStatusByIDParams{
		Status:    toNullVehiclesStatus("InRoute"),
		VehicleID: ids.VehicleID,
	}); err != nil {
		return err
	}
	if _, err := qtx.UpdateDriverStatusByID(ctx, sqlc.UpdateDriverStatusByIDParams{
		Status:   toNullDriversStatus("InRoute"),
		DriverID: ids.DriverID,
	}); err != nil {
		return err
	}
	if _, err := qtx.UpdateOrderStatusByID(ctx, sqlc.UpdateOrderStatusByIDParams{
		Status:  toNullOrdersStatus("InProgress"),
		OrderID: ids.OrderID,
	}); err != nil {
		return err
	}

	return tx.Commit()
}

func (r *TripsRepository) FinishTripAndSetAvailable(ctx context.Context, tripID int64, actualDistanceKm int32) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	qtx := sqlc.New(tx)

	ids, err := qtx.GetTripOrderVehicleDriverIDs(ctx, int32(tripID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return trips.ErrTripNotFound
		}
		return err
	}

	rows, err := qtx.UpdateTripStatusFinish(ctx, sqlc.UpdateTripStatusFinishParams{
		ActualDistanceKm: sql.NullInt32{Int32: actualDistanceKm, Valid: true},
		TripID:           int32(tripID),
	})
	if err != nil {
		return err
	}
	if rows == 0 {
		return trips.ErrInvalidState
	}

	if _, err := qtx.UpdateVehicleStatusByID(ctx, sqlc.UpdateVehicleStatusByIDParams{
		Status:    toNullVehiclesStatus("Available"),
		VehicleID: ids.VehicleID,
	}); err != nil {
		return err
	}
	if _, err := qtx.UpdateDriverStatusByID(ctx, sqlc.UpdateDriverStatusByIDParams{
		Status:   toNullDriversStatus("Available"),
		DriverID: ids.DriverID,
	}); err != nil {
		return err
	}

	activeTripsCount, err := qtx.CountActiveTripsForOrder(ctx, ids.OrderID)
	if err != nil {
		return err
	}
	if activeTripsCount == 0 {
		if _, err := qtx.UpdateOrderStatusByID(ctx, sqlc.UpdateOrderStatusByIDParams{
			Status:  toNullOrdersStatus("Completed"),
			OrderID: ids.OrderID,
		}); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *TripsRepository) AbortTripAndSetAvailable(ctx context.Context, tripID int64) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	qtx := sqlc.New(tx)

	ids, err := qtx.GetTripOrderVehicleDriverIDs(ctx, int32(tripID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return trips.ErrTripNotFound
		}
		return err
	}

	rows, err := qtx.UpdateTripStatusAbort(ctx, int32(tripID))
	if err != nil {
		return err
	}
	if rows == 0 {
		return trips.ErrInvalidState
	}

	if _, err := qtx.UpdateVehicleStatusByID(ctx, sqlc.UpdateVehicleStatusByIDParams{
		Status:    toNullVehiclesStatus("Available"),
		VehicleID: ids.VehicleID,
	}); err != nil {
		return err
	}
	if _, err := qtx.UpdateDriverStatusByID(ctx, sqlc.UpdateDriverStatusByIDParams{
		Status:   toNullDriversStatus("Available"),
		DriverID: ids.DriverID,
	}); err != nil {
		return err
	}

	return tx.Commit()
}

func (r *TripsRepository) DriverHasTripInRange(ctx context.Context, driverID int64, from, to time.Time) (bool, error) {
	const q = `
SELECT EXISTS(
  SELECT 1
  FROM Trips
  WHERE driver_id = ?
    AND status IN ('Scheduled','Active')
    AND (
      (start_time BETWEEN ? AND ?)
      OR (end_time BETWEEN ? AND ?)
      OR (start_time <= ? AND (end_time IS NULL OR end_time >= ?))
    )
);`
	var exists bool
	err := r.db.QueryRowContext(ctx, q, driverID, from, to, from, to, from, to).Scan(&exists)
	return exists, err
}

func (r *TripsRepository) VehicleHasTripInRange(ctx context.Context, vehicleID int64, from, to time.Time) (bool, error) {
	const q = `
SELECT EXISTS(
  SELECT 1
  FROM Trips
  WHERE vehicle_id = ?
    AND status IN ('Scheduled','Active')
    AND (
      (start_time BETWEEN ? AND ?)
      OR (end_time BETWEEN ? AND ?)
      OR (start_time <= ? AND (end_time IS NULL OR end_time >= ?))
    )
);`
	var exists bool
	err := r.db.QueryRowContext(ctx, q, vehicleID, from, to, from, to, from, to).Scan(&exists)
	return exists, err
}

func plannedDistanceKmFromNullString(ns sql.NullString) *int32 {
	if !ns.Valid {
		return nil
	}
	s := strings.TrimSpace(ns.String)
	if s == "" {
		return nil
	}
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return nil
	}
	v := int32(math.Round(f))
	return &v
}

func toNullTripsStatus(status string) sqlc.NullTripsStatus {
	if strings.TrimSpace(status) == "" {
		return sqlc.NullTripsStatus{}
	}
	return sqlc.NullTripsStatus{TripsStatus: sqlc.TripsStatus(status), Valid: true}
}

func toNullVehiclesStatus(status string) sqlc.NullVehiclesStatus {
	if strings.TrimSpace(status) == "" {
		return sqlc.NullVehiclesStatus{}
	}
	return sqlc.NullVehiclesStatus{VehiclesStatus: sqlc.VehiclesStatus(status), Valid: true}
}

func mapTripRow(row sqlc.ListTripsRow) trips.Trip {
	t := trips.Trip{
		ID:            int64(row.TripID),
		OrderID:       int64(row.OrderID),
		OrderNumber:   row.OrderNumber,
		ClientCompany: row.ClientCompany,
		VehicleID:     int64(row.VehicleID),
		VehicleVIN:    row.VehicleVin,
		DriverID:      int64(row.DriverID),
		DriverName:    row.FirstName + " " + row.LastName,
		Status:        string(row.Status.TripsStatus),
	}
	t.PlannedDistanceKm = plannedDistanceKmFromNullString(row.PlannedDistanceKm)
	if row.StartTime.Valid {
		v := row.StartTime.Time
		t.StartTime = &v
	}
	if row.EndTime.Valid {
		v := row.EndTime.Time
		t.EndTime = &v
	}
	if row.ActualDistanceKm.Valid {
		v := row.ActualDistanceKm.Int32
		t.ActualDistanceKm = &v
	}
	return t
}

func mapGetTripRow(row sqlc.GetTripByIDRow) trips.Trip {
	t := trips.Trip{
		ID:            int64(row.TripID),
		OrderID:       int64(row.OrderID),
		OrderNumber:   row.OrderNumber,
		ClientCompany: row.ClientCompany,
		VehicleID:     int64(row.VehicleID),
		VehicleVIN:    row.VehicleVin,
		DriverID:      int64(row.DriverID),
		DriverName:    row.FirstName + " " + row.LastName,
		Status:        string(row.Status.TripsStatus),
	}
	t.PlannedDistanceKm = plannedDistanceKmFromNullString(row.PlannedDistanceKm)
	if row.StartTime.Valid {
		v := row.StartTime.Time
		t.StartTime = &v
	}
	if row.EndTime.Valid {
		v := row.EndTime.Time
		t.EndTime = &v
	}
	if row.ActualDistanceKm.Valid {
		v := row.ActualDistanceKm.Int32
		t.ActualDistanceKm = &v
	}
	return t
}
var _ trips.Repository = (*TripsRepository)(nil)
