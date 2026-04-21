package vehicles

import (
	"context"
	"fmt"
	"strings"
	"time"
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
	search := strings.TrimSpace(query.Search)

	rows, total, err := s.repo.ListVehicles(ctx, ListVehiclesQuery{
		Status:         status,
		Search:         search,
		IncludeDeleted: query.IncludeDeleted,
		Page:           page,
		Limit:          limit,
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

func (s *Service) GetVehicleAvailability(ctx context.Context, vehicleID int64, dateFrom, dateTo string) (VehicleAvailabilityResponse, error) {
	if vehicleID <= 0 {
		return VehicleAvailabilityResponse{}, ErrInvalidInput
	}

	vehicle, err := s.repo.GetVehicleByID(ctx, vehicleID)
	if err != nil {
		return VehicleAvailabilityResponse{}, err
	}

	resp := VehicleAvailabilityResponse{
		VehicleID: vehicle.ID,
		Status:    vehicle.Status,
		Available: true,
	}

	if vehicle.Status != "Available" {
		reason := fmt.Sprintf("Vehicle status is %s", vehicle.Status)
		resp.Available = false
		resp.Reason = &reason
		return resp, nil
	}

	from, err := time.Parse("2006-01-02", strings.TrimSpace(dateFrom))
	if err != nil {
		return VehicleAvailabilityResponse{}, ErrInvalidInput
	}
	to, err := time.Parse("2006-01-02", strings.TrimSpace(dateTo))
	if err != nil {
		return VehicleAvailabilityResponse{}, ErrInvalidInput
	}
	if to.Before(from) {
		return VehicleAvailabilityResponse{}, ErrInvalidInput
	}

	trip, err := s.repo.GetTripInRange(ctx, vehicleID, from, to)
	if err != nil {
		return VehicleAvailabilityResponse{}, err
	}
	if trip == nil {
		return resp, nil
	}

	startStr := trip.Start.Format("2006-01-02")
	endStr := "ongoing"
	if trip.End != nil {
		endStr = trip.End.Format("2006-01-02")
	}
	reason := fmt.Sprintf("Vehicle already assigned to Trip #%d (%s to %s)", trip.TripID, startStr, endStr)
	resp.Available = false
	resp.Reason = &reason
	return resp, nil
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

func (s *Service) GetVehicleMaintenanceHistory(ctx context.Context, vehicleID int64, typeFilter, statusFilter string) ([]MaintenanceHistoryItem, error) {
	if vehicleID <= 0 {
		return nil, ErrInvalidInput
	}

	// Ensure vehicle exists (consistent 404 behavior).
	if _, err := s.repo.GetVehicleByID(ctx, vehicleID); err != nil {
		return nil, err
	}

	typeFilter = strings.TrimSpace(typeFilter)
	if typeFilter != "" && !isAllowedMaintenanceType(typeFilter) {
		return nil, ErrInvalidInput
	}

	statusFilter = strings.TrimSpace(statusFilter)
	if statusFilter != "" && !isAllowedMaintenanceStatus(statusFilter) {
		return nil, ErrInvalidInput
	}

	return s.repo.ListVehicleMaintenanceHistory(ctx, vehicleID, typeFilter, statusFilter)
}

func isAllowedMaintenanceType(value string) bool {
	switch value {
	case "Routine", "Repair", "TireChange":
		return true
	default:
		return false
	}
}

func isAllowedMaintenanceStatus(value string) bool {
	switch value {
	case "Scheduled", "InProgress", "Completed":
		return true
	default:
		return false
	}
}
