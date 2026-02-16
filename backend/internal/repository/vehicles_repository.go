package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/vehicles"

	mysqlDriver "github.com/go-sql-driver/mysql"
)

type VehiclesRepository struct {
	queries sqlc.Querier
}

func NewVehiclesRepository(queries sqlc.Querier) *VehiclesRepository {
	return &VehiclesRepository{queries: queries}
}

func (r *VehiclesRepository) ListVehicles(ctx context.Context, query vehicles.ListVehiclesQuery) ([]vehicles.Vehicle, int64, error) {
	offset := (query.Page - 1) * query.Limit
	statusFilter := toNullStatus(query.Status)
	filterColumnValue := interface{}(query.Status)
	if query.Status == "" {
		filterColumnValue = ""
	}

	rows, err := r.queries.ListVehicles(ctx, sqlc.ListVehiclesParams{
		Column1: filterColumnValue,
		Status:  statusFilter,
		Limit:   query.Limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountVehicles(ctx, sqlc.CountVehiclesParams{
		Column1: filterColumnValue,
		Status:  statusFilter,
	})
	if err != nil {
		return nil, 0, err
	}

	result := make([]vehicles.Vehicle, 0, len(rows))
	for _, row := range rows {
		result = append(result, mapVehicleRow(row))
	}
	return result, total, nil
}

func (r *VehiclesRepository) GetVehicleByID(ctx context.Context, vehicleID int64) (vehicles.Vehicle, error) {
	row, err := r.queries.GetVehicleByID(ctx, int32(vehicleID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return vehicles.Vehicle{}, vehicles.ErrVehicleNotFound
		}
		return vehicles.Vehicle{}, err
	}
	return mapGetVehicleRow(row), nil
}

func (r *VehiclesRepository) CreateVehicle(ctx context.Context, input vehicles.CreateVehicleRequest) (int64, error) {
	id, err := r.queries.CreateVehicle(ctx, sqlc.CreateVehicleParams{
		Vin:              strings.ToUpper(input.VIN),
		PlateNumber:      toNullString(input.PlateNumber),
		Brand:            toNullString(input.Brand),
		Model:            toNullString(input.Model),
		CapacityKg:       toNullInt32(input.CapacityKg),
		CurrentMileageKm: toNullInt32(input.CurrentMileageKm),
		Status:           toNullStatus(input.Status),
	})
	if err != nil {
		if isDuplicateEntryError(err) {
			return 0, vehicles.ErrVehicleVINConflict
		}
		return 0, err
	}
	return id, nil
}

func (r *VehiclesRepository) UpdateVehicle(ctx context.Context, vehicleID int64, input vehicles.UpdateVehicleRequest) error {
	rows, err := r.queries.UpdateVehicle(ctx, sqlc.UpdateVehicleParams{
		Vin:              strings.ToUpper(input.VIN),
		PlateNumber:      toNullString(input.PlateNumber),
		Brand:            toNullString(input.Brand),
		Model:            toNullString(input.Model),
		CapacityKg:       toNullInt32(input.CapacityKg),
		CurrentMileageKm: toNullInt32(input.CurrentMileageKm),
		Status:           toNullStatus(input.Status),
		VehicleID:        int32(vehicleID),
	})
	if err != nil {
		if isDuplicateEntryError(err) {
			return vehicles.ErrVehicleVINConflict
		}
		return err
	}
	if rows == 0 {
		return vehicles.ErrVehicleNotFound
	}
	return nil
}

func (r *VehiclesRepository) DeleteVehicle(ctx context.Context, vehicleID int64) error {
	rows, err := r.queries.SoftDeleteVehicle(ctx, int32(vehicleID))
	if err != nil {
		return err
	}
	if rows == 0 {
		return vehicles.ErrVehicleNotFound
	}
	return nil
}

func (r *VehiclesRepository) UpdateVehicleStatus(ctx context.Context, vehicleID int64, status string) error {
	rows, err := r.queries.UpdateVehicleStatus(ctx, sqlc.UpdateVehicleStatusParams{
		Status:    toNullStatus(status),
		VehicleID: int32(vehicleID),
	})
	if err != nil {
		return err
	}
	if rows == 0 {
		return vehicles.ErrVehicleNotFound
	}
	return nil
}

func toNullString(value *string) sql.NullString {
	if value == nil {
		return sql.NullString{}
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: trimmed, Valid: true}
}

func toNullInt32(value *int32) sql.NullInt32 {
	if value == nil {
		return sql.NullInt32{}
	}
	return sql.NullInt32{Int32: *value, Valid: true}
}

func toNullStatus(status string) sqlc.NullVehiclesStatus {
	if strings.TrimSpace(status) == "" {
		return sqlc.NullVehiclesStatus{}
	}
	return sqlc.NullVehiclesStatus{
		VehiclesStatus: sqlc.VehiclesStatus(status),
		Valid:          true,
	}
}

func mapVehicleRow(row sqlc.ListVehiclesRow) vehicles.Vehicle {
	vehicle := vehicles.Vehicle{
		ID:     int64(row.VehicleID),
		VIN:    row.Vin,
		Status: string(row.Status.VehiclesStatus),
	}
	if row.PlateNumber.Valid {
		value := row.PlateNumber.String
		vehicle.PlateNumber = &value
	}
	if row.Brand.Valid {
		value := row.Brand.String
		vehicle.Brand = &value
	}
	if row.Model.Valid {
		value := row.Model.String
		vehicle.Model = &value
	}
	if row.CapacityKg.Valid {
		value := row.CapacityKg.Int32
		vehicle.CapacityKg = &value
	}
	if row.CurrentMileageKm.Valid {
		value := row.CurrentMileageKm.Int32
		vehicle.CurrentMileageKm = &value
	}
	if row.CreatedAt.Valid {
		value := row.CreatedAt.Time
		vehicle.CreatedAt = &value
	}
	if row.UpdatedAt.Valid {
		value := row.UpdatedAt.Time
		vehicle.UpdatedAt = &value
	}
	return vehicle
}

func mapGetVehicleRow(row sqlc.GetVehicleByIDRow) vehicles.Vehicle {
	vehicle := vehicles.Vehicle{
		ID:     int64(row.VehicleID),
		VIN:    row.Vin,
		Status: string(row.Status.VehiclesStatus),
	}
	if row.PlateNumber.Valid {
		value := row.PlateNumber.String
		vehicle.PlateNumber = &value
	}
	if row.Brand.Valid {
		value := row.Brand.String
		vehicle.Brand = &value
	}
	if row.Model.Valid {
		value := row.Model.String
		vehicle.Model = &value
	}
	if row.CapacityKg.Valid {
		value := row.CapacityKg.Int32
		vehicle.CapacityKg = &value
	}
	if row.CurrentMileageKm.Valid {
		value := row.CurrentMileageKm.Int32
		vehicle.CurrentMileageKm = &value
	}
	if row.CreatedAt.Valid {
		value := row.CreatedAt.Time
		vehicle.CreatedAt = &value
	}
	if row.UpdatedAt.Valid {
		value := row.UpdatedAt.Time
		vehicle.UpdatedAt = &value
	}
	return vehicle
}

func isDuplicateEntryError(err error) bool {
	var mysqlErr *mysqlDriver.MySQLError
	return errors.As(err, &mysqlErr) && mysqlErr.Number == 1062
}
