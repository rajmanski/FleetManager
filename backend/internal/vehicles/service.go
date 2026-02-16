package vehicles

import (
	"context"
	"strings"
)

const (
	defaultListPage  int32 = 1
	defaultListLimit int32 = 50
	maxListLimit     int32 = 100
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListVehicles(ctx context.Context, query ListVehiclesQuery) (ListVehiclesResponse, error) {
	page := query.Page
	limit := query.Limit
	if page <= 0 {
		page = defaultListPage
	}
	if limit <= 0 {
		limit = defaultListLimit
	}
	if limit > maxListLimit {
		return ListVehiclesResponse{}, ErrInvalidInput
	}

	status := normalizeStatus(query.Status)
	if status != "" && !isAllowedStatus(status) {
		return ListVehiclesResponse{}, ErrInvalidStatus
	}

	rows, total, err := s.repo.ListVehicles(ctx, ListVehiclesQuery{
		Status: status,
		Page:   page,
		Limit:  limit,
	})
	if err != nil {
		return ListVehiclesResponse{}, err
	}

	return ListVehiclesResponse{
		Data:  rows,
		Page:  page,
		Limit: limit,
		Total: total,
	}, nil
}

func (s *Service) GetVehicleByID(ctx context.Context, vehicleID int64) (Vehicle, error) {
	if vehicleID <= 0 {
		return Vehicle{}, ErrInvalidInput
	}
	return s.repo.GetVehicleByID(ctx, vehicleID)
}

func (s *Service) CreateVehicle(ctx context.Context, req CreateVehicleRequest) (Vehicle, error) {
	vin := strings.ToUpper(strings.TrimSpace(req.VIN))
	if err := ValidateVINForCreate(vin); err != nil {
		return Vehicle{}, err
	}

	status := normalizeStatus(req.Status)
	if status == "" {
		status = "Available"
	}
	if !isAllowedStatus(status) {
		return Vehicle{}, ErrInvalidStatus
	}

	req.VIN = vin
	req.Status = status
	id, err := s.repo.CreateVehicle(ctx, req)
	if err != nil {
		return Vehicle{}, err
	}
	return s.repo.GetVehicleByID(ctx, id)
}

func (s *Service) UpdateVehicle(ctx context.Context, vehicleID int64, req UpdateVehicleRequest) (Vehicle, error) {
	if vehicleID <= 0 {
		return Vehicle{}, ErrInvalidInput
	}

	vin := strings.ToUpper(strings.TrimSpace(req.VIN))
	if err := ValidateVINForUpdate(vin); err != nil {
		return Vehicle{}, err
	}

	status := normalizeStatus(req.Status)
	if !isAllowedStatus(status) {
		return Vehicle{}, ErrInvalidStatus
	}

	req.VIN = vin
	req.Status = status
	if err := s.repo.UpdateVehicle(ctx, vehicleID, req); err != nil {
		return Vehicle{}, err
	}

	return s.repo.GetVehicleByID(ctx, vehicleID)
}

func (s *Service) DeleteVehicle(ctx context.Context, vehicleID int64) error {
	if vehicleID <= 0 {
		return ErrInvalidInput
	}

	hasActiveTrips, err := s.repo.HasActiveTrips(ctx, vehicleID)
	if err != nil {
		return err
	}
	if hasActiveTrips {
		return ErrVehicleHasActiveTrips
	}
	return s.repo.DeleteVehicle(ctx, vehicleID)
}

func (s *Service) UpdateVehicleStatus(ctx context.Context, vehicleID int64, req UpdateVehicleStatusRequest) (Vehicle, error) {
	if vehicleID <= 0 {
		return Vehicle{}, ErrInvalidInput
	}

	status := normalizeStatus(req.Status)
	if !isAllowedStatus(status) {
		return Vehicle{}, ErrInvalidStatus
	}

	if err := s.repo.UpdateVehicleStatus(ctx, vehicleID, status); err != nil {
		return Vehicle{}, err
	}
	return s.repo.GetVehicleByID(ctx, vehicleID)
}

func (s *Service) RestoreVehicle(ctx context.Context, vehicleID int64) (Vehicle, error) {
	if vehicleID <= 0 {
		return Vehicle{}, ErrInvalidInput
	}

	if err := s.repo.RestoreVehicle(ctx, vehicleID); err != nil {
		return Vehicle{}, err
	}

	return s.repo.GetVehicleByID(ctx, vehicleID)
}

func normalizeStatus(status string) string {
	return strings.TrimSpace(status)
}

func isAllowedStatus(status string) bool {
	switch status {
	case "Available", "InRoute", "Service", "Inactive":
		return true
	default:
		return false
	}
}
