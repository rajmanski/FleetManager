package trips

import (
	"context"
	"fmt"
	"strings"

	"fleet-management/internal/cargo"
	"fleet-management/internal/drivers"
	"fleet-management/internal/vehicles"
)

type Service struct {
	repo        Repository
	cargoRepo   cargo.Repository
	vehicleRepo vehicles.Repository
	driverSvc   *drivers.Service
	vehicleSvc  *vehicles.Service
}

func NewService(repo Repository, cargoRepo cargo.Repository, vehicleRepo vehicles.Repository, driverSvc *drivers.Service, vehicleSvc *vehicles.Service) *Service {
	return &Service{
		repo:        repo,
		cargoRepo:   cargoRepo,
		vehicleRepo: vehicleRepo,
		driverSvc:   driverSvc,
		vehicleSvc:  vehicleSvc,
	}
}

func (s *Service) ListTrips(ctx context.Context, query ListTripsQuery) ([]Trip, error) {
	status := strings.TrimSpace(query.Status)
	if status != "" && !isAllowedTripStatus(status) {
		return nil, ErrInvalidInput
	}
	return s.repo.ListTrips(ctx, ListTripsQuery{Status: status})
}

func (s *Service) GetTripByID(ctx context.Context, tripID int64) (Trip, error) {
	if tripID <= 0 {
		return Trip{}, ErrInvalidInput
	}
	return s.repo.GetTripByID(ctx, tripID)
}

func (s *Service) CreateTrip(ctx context.Context, req CreateTripRequest) (Trip, error) {
	if req.OrderID <= 0 || req.VehicleID <= 0 || req.DriverID <= 0 {
		return Trip{}, ErrInvalidInput
	}

	start := req.StartTime.UTC()
	if start.IsZero() {
		return Trip{}, ErrInvalidInput
	}
	dateStr := start.Format("2006-01-02")

	vehicleAvailability, err := s.vehicleSvc.GetVehicleAvailability(ctx, req.VehicleID, dateStr, dateStr)
	if err != nil {
		return Trip{}, err
	}
	if !vehicleAvailability.Available {
		return Trip{}, fmt.Errorf("%w: vehicle not available", ErrValidationFailed)
	}

	driverAvailability, err := s.driverSvc.GetDriverAvailabilityInRange(ctx, req.DriverID, dateStr, dateStr)
	if err != nil {
		return Trip{}, err
	}
	if !driverAvailability.Available {
		return Trip{}, fmt.Errorf("%w: driver not available", ErrValidationFailed)
	}

	adr, err := s.driverSvc.CanDriverTransportHazardousCargo(ctx, req.DriverID, req.OrderID)
	if err != nil {
		return Trip{}, err
	}
	if !adr.CanTransport {
		return Trip{}, fmt.Errorf("%w: driver cannot transport hazardous cargo", ErrValidationFailed)
	}

	if err := ValidateCargoFitsVehicle(ctx, s.cargoRepo, s.vehicleRepo, req.OrderID, req.VehicleID); err != nil {
		return Trip{}, err
	}

	tripID, err := s.repo.CreateTripAndSetInRoute(ctx, CreateTripRequest{
		OrderID:   req.OrderID,
		VehicleID: req.VehicleID,
		DriverID:  req.DriverID,
		StartTime: start,
	})
	if err != nil {
		return Trip{}, err
	}

	return s.repo.GetTripByID(ctx, tripID)
}

func (s *Service) StartTrip(ctx context.Context, tripID int64) (Trip, error) {
	if tripID <= 0 {
		return Trip{}, ErrInvalidInput
	}
	if err := s.repo.StartTripAndSetInRoute(ctx, tripID); err != nil {
		return Trip{}, err
	}
	return s.repo.GetTripByID(ctx, tripID)
}

func (s *Service) FinishTrip(ctx context.Context, tripID int64, actualDistanceKm int32) (Trip, error) {
	if tripID <= 0 || actualDistanceKm <= 0 {
		return Trip{}, ErrInvalidInput
	}
	if err := s.repo.FinishTripAndSetAvailable(ctx, tripID, actualDistanceKm); err != nil {
		return Trip{}, err
	}
	return s.repo.GetTripByID(ctx, tripID)
}

func (s *Service) AbortTrip(ctx context.Context, tripID int64) (Trip, error) {
	if tripID <= 0 {
		return Trip{}, ErrInvalidInput
	}
	if err := s.repo.AbortTripAndSetAvailable(ctx, tripID); err != nil {
		return Trip{}, err
	}
	return s.repo.GetTripByID(ctx, tripID)
}

func isAllowedTripStatus(status string) bool {
	switch status {
	case "Scheduled", "Active", "Finished", "Aborted":
		return true
	default:
		return false
	}
}

