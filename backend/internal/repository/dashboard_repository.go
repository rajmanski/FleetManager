package repository

import (
	"context"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/dashboard"
)

type DashboardRepository struct {
	queries sqlc.Querier
}

func NewDashboardRepository(queries sqlc.Querier) *DashboardRepository {
	return &DashboardRepository{queries: queries}
}

func (r *DashboardRepository) CountActiveOrders(ctx context.Context) (int64, error) {
	return r.queries.CountActiveOrders(ctx)
}

func (r *DashboardRepository) CountVehiclesInService(ctx context.Context) (int64, error) {
	return r.queries.CountVehiclesInService(ctx)
}

func (r *DashboardRepository) GetCurrentMonthCosts(ctx context.Context) (float64, error) {
	value, err := r.queries.GetCurrentMonthCost(ctx)
	if err != nil {
		return 0, err
	}
	return parseDecimalAny(value)
}

func (r *DashboardRepository) GetCurrentMonthRevenue(ctx context.Context) (float64, error) {
	value, err := r.queries.GetCurrentMonthRevenue(ctx)
	if err != nil {
		return 0, err
	}
	return parseDecimalAny(value)
}

func (r *DashboardRepository) ListExpiringInsuranceAlerts(ctx context.Context) ([]dashboard.Alert, error) {
	rows, err := r.queries.ListExpiringInsuranceAlerts(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]dashboard.Alert, 0, len(rows))
	for _, row := range rows {
		out = append(out, dashboard.Alert{
			Type:    row.Type,
			Message: row.Message,
		})
	}
	return out, nil
}

func (r *DashboardRepository) ListUpcomingInspectionAlerts(ctx context.Context) ([]dashboard.Alert, error) {
	rows, err := r.queries.ListUpcomingInspectionAlerts(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]dashboard.Alert, 0, len(rows))
	for _, row := range rows {
		out = append(out, dashboard.Alert{
			Type:    row.Type,
			Message: row.Message,
		})
	}
	return out, nil
}

func (r *DashboardRepository) ListExpiringLicenseAlerts(ctx context.Context) ([]dashboard.Alert, error) {
	rows, err := r.queries.ListExpiringLicenseAlerts(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]dashboard.Alert, 0, len(rows))
	for _, row := range rows {
		out = append(out, dashboard.Alert{
			Type:    row.Type,
			Message: row.Message,
		})
	}
	return out, nil
}

func (r *DashboardRepository) ListExpiringAdrAlerts(ctx context.Context) ([]dashboard.Alert, error) {
	rows, err := r.queries.ListExpiringAdrAlerts(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]dashboard.Alert, 0, len(rows))
	for _, row := range rows {
		out = append(out, dashboard.Alert{
			Type:    row.Type,
			Message: row.Message,
		})
	}
	return out, nil
}

var _ dashboard.Repository = (*DashboardRepository)(nil)
