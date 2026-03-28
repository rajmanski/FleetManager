package reports

import (
	"context"
	"time"
)

type Repository interface {
	GetVehicleRevenueForMonth(ctx context.Context, vehicleID int64, month string) (float64, error)
	GetVehicleFuelCostsForMonth(ctx context.Context, vehicleID int64, month string) (float64, error)
	GetVehicleMaintenanceCostsForMonth(ctx context.Context, vehicleID int64, month string) (float64, error)
	GetVehicleInsuranceMonthlyCost(
		ctx context.Context,
		vehicleID int64,
		monthStart time.Time,
		monthEnd time.Time,
	) (float64, error)
	GetVehicleTollsForMonth(ctx context.Context, vehicleID int64, month string) (float64, error)
	GetDriverMileageReport(
		ctx context.Context,
		driverID int64,
		dateFrom time.Time,
		dateTo time.Time,
	) (totalKm float64, ordersCount int64, err error)
}
