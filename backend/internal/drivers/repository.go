package drivers

import "context"

type Repository interface {
	ListDrivers(ctx context.Context, query ListDriversQuery) ([]Driver, int64, error)
	GetDriverByID(ctx context.Context, driverID int64) (Driver, error)
	CreateDriver(ctx context.Context, input CreateDriverRequest) (int64, error)
	UpdateDriver(ctx context.Context, driverID int64, input UpdateDriverRequest) error
	DeleteDriver(ctx context.Context, driverID int64) error
	RestoreDriver(ctx context.Context, driverID int64) error
}
