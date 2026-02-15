package vehicles

import "context"

type Repository interface {
	ListVehicles(ctx context.Context, query ListVehiclesQuery) ([]Vehicle, int64, error)
	GetVehicleByID(ctx context.Context, vehicleID int64) (Vehicle, error)
	CreateVehicle(ctx context.Context, input CreateVehicleRequest) (int64, error)
	UpdateVehicle(ctx context.Context, vehicleID int64, input UpdateVehicleRequest) error
	DeleteVehicle(ctx context.Context, vehicleID int64) error
}
