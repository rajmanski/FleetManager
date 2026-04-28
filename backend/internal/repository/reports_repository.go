package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
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
		VehicleID:      int32(vehicleID),
		CreationDate:   sql.NullTime{Time: monthStart, Valid: true},
		CreationDate_2: sql.NullTime{Time: monthEnd, Valid: true},
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
	value, err := r.queries.GetVehicleFuelCostsForMonth(ctx, sqlc.GetVehicleFuelCostsForMonthParams{
		VehicleID: int32(vehicleID),
		DateStart: monthStart,
		DateEnd:   monthEnd,
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
	value, err := r.queries.GetVehicleMaintenanceCostsForMonth(ctx, sqlc.GetVehicleMaintenanceCostsForMonthParams{
		VehicleID: int32(vehicleID),
		StartDate: sql.NullTime{Time: monthStart, Valid: true},
		EndDate:   sql.NullTime{Time: monthEnd, Valid: true},
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
		DateStart: monthStart,
		DateEnd:   monthEnd,
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
	fuelRaw, err := r.queries.GetGlobalFuelCostsInRange(ctx, sqlc.GetGlobalFuelCostsInRangeParams{
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

	maintRaw, err := r.queries.GetGlobalMaintenanceCostsInRange(ctx, sqlc.GetGlobalMaintenanceCostsInRangeParams{
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

	insRaw, err := r.queries.GetGlobalInsuranceCostsInRange(ctx, sqlc.GetGlobalInsuranceCostsInRangeParams{
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

	tollsRaw, err := r.queries.GetGlobalTollsCostsInRange(ctx, sqlc.GetGlobalTollsCostsInRangeParams{
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

	otherRaw, err := r.queries.GetGlobalOtherCostsInRange(ctx, sqlc.GetGlobalOtherCostsInRangeParams{
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

func parseDecimalAny(value interface{}) (float64, error) {
	switch v := value.(type) {
	case float64:
		return v, nil
	case int64:
		return float64(v), nil
	case []byte:
		return strconv.ParseFloat(string(v), 64)
	case string:
		return strconv.ParseFloat(v, 64)
	default:
		var parsed float64
		_, err := fmt.Sscanf(fmt.Sprint(v), "%f", &parsed)
		if err != nil {
			return 0, err
		}
		return parsed, nil
	}
}
