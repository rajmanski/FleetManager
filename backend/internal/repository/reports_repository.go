package repository

import (
	"context"
	"database/sql"
	"time"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/reports"
)

type ReportsRepository struct {
	queries sqlc.Querier
}

func NewReportsRepository(queries sqlc.Querier) *ReportsRepository {
	return &ReportsRepository{queries: queries}
}

func (r *ReportsRepository) GetVehicleRevenueForMonth(
	ctx context.Context,
	vehicleID int64,
	monthStart time.Time,
	monthEnd time.Time,
) (float64, error) {
	value, err := r.queries.GetVehicleRevenueForMonth(ctx, sqlc.GetVehicleRevenueForMonthParams{
		VehicleID: int32(vehicleID),
		EndTime:   sql.NullTime{Time: monthStart, Valid: true},
		EndTime_2: sql.NullTime{Time: monthEnd, Valid: true},
	})
	if err != nil {
		return 0, err
	}
	return parseDecimalAny(value)
}

func (r *ReportsRepository) GetVehicleFuelCostsForMonth(
	ctx context.Context,
	vehicleID int64,
	monthStart time.Time,
	monthEnd time.Time,
) (float64, error) {
	value, err := r.queries.GetVehicleFuelCostForMonth(ctx, sqlc.GetVehicleFuelCostForMonthParams{
		VehicleID: int32(vehicleID),
		Date:      monthStart,
		Date_2:    monthEnd,
	})
	if err != nil {
		return 0, err
	}
	return parseDecimalAny(value)
}

func (r *ReportsRepository) GetVehicleMaintenanceCostsForMonth(
	ctx context.Context,
	vehicleID int64,
	monthStart time.Time,
	monthEnd time.Time,
) (float64, error) {
	value, err := r.queries.GetVehicleMaintenanceCostForMonth(ctx, sqlc.GetVehicleMaintenanceCostForMonthParams{
		VehicleID:   int32(vehicleID),
		StartDate:   sql.NullTime{Time: monthStart, Valid: true},
		StartDate_2: sql.NullTime{Time: monthEnd, Valid: true},
	})
	if err != nil {
		return 0, err
	}
	return parseDecimalAny(value)
}

func (r *ReportsRepository) GetVehicleInsuranceMonthlyCost(
	ctx context.Context,
	vehicleID int64,
	monthStart time.Time,
	monthEnd time.Time,
) (float64, error) {
	value, err := r.queries.GetVehicleInsuranceMonthlyCost(ctx, sqlc.GetVehicleInsuranceMonthlyCostParams{
		VehicleID: int32(vehicleID),
		StartDate: monthEnd,
		EndDate:   monthStart,
	})
	if err != nil {
		return 0, err
	}
	return parseDecimalAny(value)
}

func (r *ReportsRepository) GetVehicleTollsForMonth(
	ctx context.Context,
	vehicleID int64,
	monthStart time.Time,
	monthEnd time.Time,
) (float64, error) {
	value, err := r.queries.GetVehicleTollsForMonth(ctx, sqlc.GetVehicleTollsForMonthParams{
		VehicleID: int32(vehicleID),
		Date:      monthStart,
		Date_2:    monthEnd,
	})
	if err != nil {
		return 0, err
	}
	return parseDecimalAny(value)
}

func (r *ReportsRepository) GetDriverMileageReport(
	ctx context.Context,
	driverID int64,
	dateFrom time.Time,
	dateTo time.Time,
) (float64, int64, error) {
	row, err := r.queries.GetDriverMileageReport(ctx, sqlc.GetDriverMileageReportParams{
		DriverID:  int32(driverID),
		EndTime:   sql.NullTime{Time: dateFrom, Valid: true},
		EndTime_2: sql.NullTime{Time: dateTo, Valid: true},
	})
	if err != nil {
		return 0, 0, err
	}
	totalKm, err := parseDecimalAny(row.TotalKm)
	if err != nil {
		return 0, 0, err
	}
	return totalKm, row.OrdersCount, nil
}

func (r *ReportsRepository) GetGlobalCostsInRange(
	ctx context.Context,
	from, to time.Time,
) (reports.GlobalCostsByCategory, error) {
	fuelRaw, err := r.queries.GetGlobalFuelCostInRange(ctx, sqlc.GetGlobalFuelCostInRangeParams{
		Date:   from,
		Date_2: to,
	})
	if err != nil {
		return reports.GlobalCostsByCategory{}, err
	}
	fuel, err := parseDecimalAny(fuelRaw)
	if err != nil {
		return reports.GlobalCostsByCategory{}, err
	}

	maintRaw, err := r.queries.GetGlobalMaintenanceCostInRange(ctx, sqlc.GetGlobalMaintenanceCostInRangeParams{
		StartDate:   sql.NullTime{Time: from, Valid: true},
		StartDate_2: sql.NullTime{Time: to, Valid: true},
	})
	if err != nil {
		return reports.GlobalCostsByCategory{}, err
	}
	maintenance, err := parseDecimalAny(maintRaw)
	if err != nil {
		return reports.GlobalCostsByCategory{}, err
	}

	insRaw, err := r.queries.GetGlobalInsuranceCostInRange(ctx, sqlc.GetGlobalInsuranceCostInRangeParams{
		PeriodEnd:   to,
		PeriodStart: from,
	})
	if err != nil {
		return reports.GlobalCostsByCategory{}, err
	}
	insurance, err := parseDecimalAny(insRaw)
	if err != nil {
		return reports.GlobalCostsByCategory{}, err
	}

	tollsRaw, err := r.queries.GetGlobalTollsCostInRange(ctx, sqlc.GetGlobalTollsCostInRangeParams{
		Date:   from,
		Date_2: to,
	})
	if err != nil {
		return reports.GlobalCostsByCategory{}, err
	}
	tolls, err := parseDecimalAny(tollsRaw)
	if err != nil {
		return reports.GlobalCostsByCategory{}, err
	}

	otherRaw, err := r.queries.GetGlobalOtherCostInRange(ctx, sqlc.GetGlobalOtherCostInRangeParams{
		Date:   from,
		Date_2: to,
	})
	if err != nil {
		return reports.GlobalCostsByCategory{}, err
	}
	other, err := parseDecimalAny(otherRaw)
	if err != nil {
		return reports.GlobalCostsByCategory{}, err
	}

	return reports.GlobalCostsByCategory{
		Fuel:        fuel,
		Maintenance: maintenance,
		Insurance:   insurance,
		Tolls:       tolls,
		Other:       other,
	}, nil
}

var _ reports.Repository = (*ReportsRepository)(nil)
