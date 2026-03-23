package fuel

import "context"

type Repository interface {
	GetVehicleCurrentMileage(ctx context.Context, vehicleID int64) (int64, error)
	GetAvgFuelConsumptionPer100Km(ctx context.Context, vehicleID int64) (*float64, error)
	CreateFuelLogAndUpdate(
		ctx context.Context,
		input CreateFuelRepositoryInput,
		alert *CreateFuelAlertInput,
	) (int64, error)
	ListFuelLogs(ctx context.Context, query ListFuelLogsQuery) ([]FuelLog, int64, error)
}

