package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/assignments"
)

type AssignmentsRepository struct {
	queries sqlc.Querier
}

func NewAssignmentsRepository(queries sqlc.Querier) *AssignmentsRepository {
	return &AssignmentsRepository{queries: queries}
}

func (r *AssignmentsRepository) ListAssignments(ctx context.Context, query assignments.ListAssignmentsQuery) ([]assignments.Assignment, int64, error) {
	offset := (query.Page - 1) * query.Limit
	activeFilter := interface{}(0)
	if query.ActiveOnly {
		activeFilter = 1
	}

	rows, err := r.queries.ListAssignments(ctx, sqlc.ListAssignmentsParams{
		Column1: activeFilter,
		Limit:   query.Limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountAssignments(ctx, activeFilter)
	if err != nil {
		return nil, 0, err
	}

	result := make([]assignments.Assignment, 0, len(rows))
	for _, row := range rows {
		result = append(result, mapListAssignmentsRow(row))
	}
	return result, total, nil
}

func (r *AssignmentsRepository) GetAssignmentByID(ctx context.Context, assignmentID int64) (assignments.Assignment, error) {
	row, err := r.queries.GetAssignmentByID(ctx, int32(assignmentID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return assignments.Assignment{}, assignments.ErrAssignmentNotFound
		}
		return assignments.Assignment{}, err
	}
	return mapGetAssignmentByIDRow(row), nil
}

func (r *AssignmentsRepository) CreateAssignment(ctx context.Context, input assignments.CreateAssignmentRequest) (int64, error) {
	id, err := r.queries.CreateAssignment(ctx, sqlc.CreateAssignmentParams{
		VehicleID:    int32(input.VehicleID),
		DriverID:     int32(input.DriverID),
		AssignedFrom: input.AssignedFrom,
	})
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *AssignmentsRepository) EndAssignment(ctx context.Context, assignmentID int64, endTime time.Time) error {
	rows, err := r.queries.EndAssignment(ctx, sqlc.EndAssignmentParams{
		AssignedTo:   sql.NullTime{Time: endTime, Valid: true},
		AssignmentID: int32(assignmentID),
	})
	if err != nil {
		return err
	}
	if rows == 0 {
		return assignments.ErrAssignmentNotFound
	}
	return nil
}

func (r *AssignmentsRepository) HasDriverOverlappingAssignment(ctx context.Context, driverID int64, assignedFrom time.Time) (bool, error) {
	return r.queries.HasDriverOverlappingAssignment(ctx, sqlc.HasDriverOverlappingAssignmentParams{
		DriverID:     int32(driverID),
		AssignedFrom: assignedFrom,
		AssignedTo:   sql.NullTime{Time: assignedFrom, Valid: true},
	})
}

func (r *AssignmentsRepository) VehicleExists(ctx context.Context, vehicleID int64) (bool, error) {
	_, err := r.queries.GetVehicleByID(ctx, int32(vehicleID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (r *AssignmentsRepository) DriverExists(ctx context.Context, driverID int64) (bool, error) {
	_, err := r.queries.GetDriverByID(ctx, int32(driverID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (r *AssignmentsRepository) ListAssignmentsByVehicleID(ctx context.Context, vehicleID int64) ([]assignments.AssignmentHistoryItem, error) {
	rows, err := r.queries.ListAssignmentsByVehicleID(ctx, int32(vehicleID))
	if err != nil {
		return nil, err
	}
	result := make([]assignments.AssignmentHistoryItem, 0, len(rows))
	for _, row := range rows {
		result = append(result, mapAssignmentHistoryFromVehicleRow(row))
	}
	return result, nil
}

func (r *AssignmentsRepository) ListAssignmentsByDriverID(ctx context.Context, driverID int64) ([]assignments.AssignmentHistoryItem, error) {
	rows, err := r.queries.ListAssignmentsByDriverID(ctx, int32(driverID))
	if err != nil {
		return nil, err
	}
	result := make([]assignments.AssignmentHistoryItem, 0, len(rows))
	for _, row := range rows {
		result = append(result, mapAssignmentHistoryFromDriverRow(row))
	}
	return result, nil
}

func mapAssignmentHistoryFromVehicleRow(row sqlc.ListAssignmentsByVehicleIDRow) assignments.AssignmentHistoryItem {
	return mapAssignmentHistoryRow(row.AssignmentID, row.VehicleID, row.DriverID, row.AssignedFrom, row.AssignedTo, row.Vin, row.FirstName, row.LastName)
}

func mapAssignmentHistoryFromDriverRow(row sqlc.ListAssignmentsByDriverIDRow) assignments.AssignmentHistoryItem {
	return mapAssignmentHistoryRow(row.AssignmentID, row.VehicleID, row.DriverID, row.AssignedFrom, row.AssignedTo, row.Vin, row.FirstName, row.LastName)
}

func mapAssignmentHistoryRow(assignmentID, vehicleID, driverID int32, assignedFrom time.Time, assignedTo sql.NullTime, vin, firstName, lastName string) assignments.AssignmentHistoryItem {
	item := assignments.AssignmentHistoryItem{
		AssignmentID: int64(assignmentID),
		Driver: assignments.DriverRef{
			ID:   int64(driverID),
			Name: firstName + " " + lastName,
		},
		Vehicle: assignments.VehicleRef{
			ID:  int64(vehicleID),
			VIN: vin,
		},
		AssignedFrom: assignedFrom.Format("2006-01-02"),
	}
	if assignedTo.Valid {
		s := assignedTo.Time.Format("2006-01-02")
		item.AssignedTo = &s
	}
	return item
}

func mapListAssignmentsRow(row sqlc.ListAssignmentsRow) assignments.Assignment {
	a := assignments.Assignment{
		AssignmentID: int64(row.AssignmentID),
		VehicleID:    int64(row.VehicleID),
		DriverID:     int64(row.DriverID),
		AssignedFrom: row.AssignedFrom,
		VehicleVIN:   row.Vin,
		DriverName:   row.FirstName + " " + row.LastName,
	}
	if row.AssignedTo.Valid {
		t := row.AssignedTo.Time
		a.AssignedTo = &t
	}
	if row.Brand.Valid {
		a.VehicleBrand = row.Brand.String
	}
	if row.Model.Valid {
		a.VehicleModel = row.Model.String
	}
	return a
}

func mapGetAssignmentByIDRow(row sqlc.GetAssignmentByIDRow) assignments.Assignment {
	a := assignments.Assignment{
		AssignmentID: int64(row.AssignmentID),
		VehicleID:    int64(row.VehicleID),
		DriverID:     int64(row.DriverID),
		AssignedFrom: row.AssignedFrom,
		VehicleVIN:   row.Vin,
		DriverName:   row.FirstName + " " + row.LastName,
	}
	if row.AssignedTo.Valid {
		t := row.AssignedTo.Time
		a.AssignedTo = &t
	}
	if row.Brand.Valid {
		a.VehicleBrand = row.Brand.String
	}
	if row.Model.Valid {
		a.VehicleModel = row.Model.String
	}
	return a
}
