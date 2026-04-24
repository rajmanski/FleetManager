package trips

import (
	"context"
	"time"
)

type Repository interface {
	ListTrips(ctx context.Context, query ListTripsQuery) ([]Trip, error)
	ListTripsByOrderID(ctx context.Context, orderID int64) ([]Trip, error)
	GetTripByID(ctx context.Context, tripID int64) (Trip, error)
	CreateTripAndSetInRoute(ctx context.Context, input CreateTripRequest) (int64, error)
	StartTripAndSetInRoute(ctx context.Context, tripID int64) error
	FinishTripAndSetAvailable(ctx context.Context, tripID int64, actualDistanceKm int32) error
	AbortTripAndSetAvailable(ctx context.Context, tripID int64) error

	TripExists(ctx context.Context, tripID int64) (bool, error)
	GetTripOrderVehicleDriverIDs(ctx context.Context, tripID int64) (orderID, vehicleID, driverID int64, err error)

	DriverHasTripInRange(ctx context.Context, driverID int64, from, to time.Time) (bool, error)
	VehicleHasTripInRange(ctx context.Context, vehicleID int64, from, to time.Time) (bool, error)
}
