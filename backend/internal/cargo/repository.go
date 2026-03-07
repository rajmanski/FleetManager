package cargo

import "context"

type Repository interface {
	ListCargoByOrderID(ctx context.Context, orderID int64) ([]CargoRow, error)
	GetCargoByID(ctx context.Context, cargoID int64) (CargoRow, bool, error)
	CreateCargo(ctx context.Context, orderID int64, description string, weightKg, volumeM3 float64, cargoType string) (int64, error)
	UpdateCargo(ctx context.Context, cargoID int64, description string, weightKg, volumeM3 float64, cargoType string) (int64, error)
	DeleteCargo(ctx context.Context, cargoID int64) (int64, error)
	AssignCargoWaypoint(ctx context.Context, cargoID int64, waypointID *int64) (int64, error)
	GetOrderStatusByCargoID(ctx context.Context, cargoID int64) (string, error)
	WaypointBelongsToCargoOrder(ctx context.Context, cargoID int64, waypointID int64) (bool, error)
	SumCargoWeightByOrderID(ctx context.Context, orderID int64) (float64, error)
}

type CargoRow struct {
	ID                   int64
	OrderID              int64
	DestinationWaypointID *int64
	Description          string
	WeightKg             float64
	VolumeM3             float64
	CargoType            string
}
