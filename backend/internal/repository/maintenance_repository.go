package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/maintenance"
)

type MaintenanceRepository struct {
	queries sqlc.Querier
}

func NewMaintenanceRepository(queries sqlc.Querier) *MaintenanceRepository {
	return &MaintenanceRepository{queries: queries}
}

func (r *MaintenanceRepository) ListMaintenance(ctx context.Context, query maintenance.ListMaintenanceQuery) ([]maintenance.Maintenance, int64, error) {
	offset := (query.Page - 1) * query.Limit

	vehicleFilter := interface{}(0)
	vehicleID := int32(0)
	if query.VehicleID > 0 {
		vehicleFilter = 1
		vehicleID = int32(query.VehicleID)
	}

	statusColumnValue := interface{}(query.Status)
	status := sqlc.MaintenanceStatus(query.Status)
	if strings.TrimSpace(query.Status) == "" {
		statusColumnValue = ""
		status = sqlc.MaintenanceStatusScheduled
	}

	rows, err := r.queries.ListMaintenance(ctx, sqlc.ListMaintenanceParams{
		Column1:   vehicleFilter,
		VehicleID: vehicleID,
		Column3:   statusColumnValue,
		Status:    status,
		Limit:     query.Limit,
		Offset:    offset,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountMaintenance(ctx, sqlc.CountMaintenanceParams{
		Column1:   vehicleFilter,
		VehicleID: vehicleID,
		Column3:   statusColumnValue,
		Status:    status,
	})
	if err != nil {
		return nil, 0, err
	}

	result := make([]maintenance.Maintenance, 0, len(rows))
	for _, row := range rows {
		result = append(result, mapMaintenanceRow(row))
	}
	return result, total, nil
}

func (r *MaintenanceRepository) GetMaintenanceByID(ctx context.Context, maintenanceID int64) (maintenance.Maintenance, error) {
	row, err := r.queries.GetMaintenanceByID(ctx, int32(maintenanceID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return maintenance.Maintenance{}, maintenance.ErrMaintenanceNotFound
		}
		return maintenance.Maintenance{}, err
	}
	return mapMaintenanceRow(row), nil
}

func (r *MaintenanceRepository) CreateMaintenance(ctx context.Context, input maintenance.CreateMaintenanceRequest) (int64, error) {
	status := "Scheduled"
	if input.Status != nil && strings.TrimSpace(*input.Status) != "" {
		status = strings.TrimSpace(*input.Status)
	}

	labor := float64OrZero(input.LaborCostPln)
	parts := float64OrZero(input.PartsCostPln)

	return r.queries.CreateMaintenance(ctx, sqlc.CreateMaintenanceParams{
		VehicleID:    int32(input.VehicleID),
		StartDate:    maintenanceToNullTimeFromString(input.StartDate),
		EndDate:      maintenanceToNullTimeFromString(input.EndDate),
		Type:         sqlc.MaintenanceType(strings.TrimSpace(input.Type)),
		Status:       sqlc.MaintenanceStatus(status),
		Description:  maintenanceToNullString(input.Description),
		LaborCostPln: fmt.Sprintf("%.2f", labor),
		PartsCostPln: fmt.Sprintf("%.2f", parts),
	})
}

func (r *MaintenanceRepository) UpdateMaintenance(ctx context.Context, maintenanceID int64, input maintenance.UpdateMaintenanceRequest) error {
	status := "Scheduled"
	if input.Status != nil && strings.TrimSpace(*input.Status) != "" {
		status = strings.TrimSpace(*input.Status)
	}

	labor := float64OrZero(input.LaborCostPln)
	parts := float64OrZero(input.PartsCostPln)

	rows, err := r.queries.UpdateMaintenance(ctx, sqlc.UpdateMaintenanceParams{
		VehicleID:     int32(input.VehicleID),
		StartDate:     maintenanceToNullTimeFromString(input.StartDate),
		EndDate:       maintenanceToNullTimeFromString(input.EndDate),
		Type:          sqlc.MaintenanceType(strings.TrimSpace(input.Type)),
		Status:        sqlc.MaintenanceStatus(status),
		Description:   maintenanceToNullString(input.Description),
		LaborCostPln:  fmt.Sprintf("%.2f", labor),
		PartsCostPln:  fmt.Sprintf("%.2f", parts),
		MaintenanceID: int32(maintenanceID),
	})
	if err != nil {
		return err
	}
	if rows == 0 {
		return maintenance.ErrMaintenanceNotFound
	}
	return nil
}

func (r *MaintenanceRepository) UpdateMaintenanceStatus(ctx context.Context, maintenanceID int64, status string) error {
	rows, err := r.queries.UpdateMaintenanceStatus(ctx, sqlc.UpdateMaintenanceStatusParams{
		Status:        sqlc.MaintenanceStatus(status),
		MaintenanceID: int32(maintenanceID),
	})
	if err != nil {
		return err
	}
	if rows == 0 {
		return maintenance.ErrMaintenanceNotFound
	}
	return nil
}

func mapMaintenanceRow(row sqlc.Maintenance) maintenance.Maintenance {
	m := maintenance.Maintenance{
		ID:        int64(row.MaintenanceID),
		VehicleID: int64(row.VehicleID),
		Type:      string(row.Type),
		Status:    string(row.Status),
	}
	if row.StartDate.Valid {
		t := row.StartDate.Time
		m.StartDate = &t
	}
	if row.EndDate.Valid {
		t := row.EndDate.Time
		m.EndDate = &t
	}
	if row.Description.Valid {
		s := row.Description.String
		m.Description = &s
	}
	{
		var f float64
		fmt.Sscanf(row.LaborCostPln, "%f", &f)
		m.LaborCostPln = f
	}
	{
		var f float64
		fmt.Sscanf(row.PartsCostPln, "%f", &f)
		m.PartsCostPln = f
	}
	{
		var f float64
		if row.TotalCostPln.Valid {
			fmt.Sscanf(row.TotalCostPln.String, "%f", &f)
		}
		m.TotalCostPln = f
	}
	if row.CreatedAt.Valid {
		t := row.CreatedAt.Time
		m.CreatedAt = &t
	}
	if row.UpdatedAt.Valid {
		t := row.UpdatedAt.Time
		m.UpdatedAt = &t
	}
	return m
}

func float64OrZero(v *float64) float64 {
	if v == nil {
		return 0
	}
	return *v
}

func maintenanceToNullTimeFromString(s *string) sql.NullTime {
	if s == nil || strings.TrimSpace(*s) == "" {
		return sql.NullTime{}
	}
	t, err := time.Parse("2006-01-02", strings.TrimSpace(*s))
	if err != nil {
		t, err = time.Parse(time.RFC3339, strings.TrimSpace(*s))
		if err != nil {
			return sql.NullTime{}
		}
	}
	return sql.NullTime{Time: t, Valid: true}
}

func maintenanceToNullString(value *string) sql.NullString {
	if value == nil {
		return sql.NullString{}
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: trimmed, Valid: true}
}

