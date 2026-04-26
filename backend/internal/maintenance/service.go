package maintenance

import (
	"context"
	"strings"

	sqlc "fleet-management/internal/db/sqlc"
)

const (
	defaultListPage  int32 = 1
	defaultListLimit int32 = 50
	maxListLimit     int32 = 100
)

type Service struct {
	repo    Repository
	queries sqlc.Querier
}

func NewService(repo Repository, queries sqlc.Querier) *Service {
	return &Service{repo: repo, queries: queries}
}

func (s *Service) ListMaintenance(ctx context.Context, query ListMaintenanceQuery) (ListMaintenanceResponse, error) {
	page := query.Page
	limit := query.Limit
	if page <= 0 {
		page = defaultListPage
	}
	if limit <= 0 {
		limit = defaultListLimit
	}
	if limit > maxListLimit {
		return ListMaintenanceResponse{}, ErrInvalidInput
	}

	status := strings.TrimSpace(query.Status)
	if status != "" && !isValidStatus(status) {
		return ListMaintenanceResponse{}, ErrInvalidStatus
	}

	if query.VehicleID < 0 {
		return ListMaintenanceResponse{}, ErrInvalidInput
	}

	rows, total, err := s.repo.ListMaintenance(ctx, ListMaintenanceQuery{
		VehicleID: query.VehicleID,
		Status:    status,
		Page:      page,
		Limit:     limit,
	})
	if err != nil {
		return ListMaintenanceResponse{}, err
	}

	return ListMaintenanceResponse{
		Data:  rows,
		Page:  page,
		Limit: limit,
		Total: total,
	}, nil
}

func (s *Service) GetMaintenanceByID(ctx context.Context, maintenanceID int64) (Maintenance, error) {
	if maintenanceID <= 0 {
		return Maintenance{}, ErrInvalidInput
	}
	return s.repo.GetMaintenanceByID(ctx, maintenanceID)
}

func (s *Service) CreateMaintenance(ctx context.Context, req CreateMaintenanceRequest) (Maintenance, error) {
	req.Type = strings.TrimSpace(req.Type)
	if req.VehicleID <= 0 {
		return Maintenance{}, ErrInvalidInput
	}
	if !isValidType(req.Type) {
		return Maintenance{}, ErrInvalidType
	}

	status := "Scheduled"
	if req.Status != nil {
		status = strings.TrimSpace(*req.Status)
	}
	if status == "" || !isValidStatus(status) {
		return Maintenance{}, ErrInvalidStatus
	}

	id, err := s.repo.CreateMaintenance(ctx, CreateMaintenanceRequest{
		VehicleID:    req.VehicleID,
		StartDate:    req.StartDate,
		EndDate:      req.EndDate,
		Type:         req.Type,
		Status:       &status,
		Description:  req.Description,
		LaborCostPln: req.LaborCostPln,
		PartsCostPln: req.PartsCostPln,
	})
	if err != nil {
		return Maintenance{}, err
	}
	return s.repo.GetMaintenanceByID(ctx, id)
}

func (s *Service) UpdateMaintenance(ctx context.Context, maintenanceID int64, req UpdateMaintenanceRequest) (Maintenance, error) {
	if maintenanceID <= 0 || req.VehicleID <= 0 {
		return Maintenance{}, ErrInvalidInput
	}

	req.Type = strings.TrimSpace(req.Type)
	if !isValidType(req.Type) {
		return Maintenance{}, ErrInvalidType
	}

	status := "Scheduled"
	if req.Status != nil {
		status = strings.TrimSpace(*req.Status)
	}
	if status == "" || !isValidStatus(status) {
		return Maintenance{}, ErrInvalidStatus
	}

	if err := s.repo.UpdateMaintenance(ctx, maintenanceID, UpdateMaintenanceRequest{
		VehicleID:    req.VehicleID,
		StartDate:    req.StartDate,
		EndDate:      req.EndDate,
		Type:         req.Type,
		Status:       &status,
		Description:  req.Description,
		LaborCostPln: req.LaborCostPln,
		PartsCostPln: req.PartsCostPln,
	}); err != nil {
		return Maintenance{}, err
	}

	return s.repo.GetMaintenanceByID(ctx, maintenanceID)
}

func (s *Service) UpdateMaintenanceStatus(ctx context.Context, maintenanceID int64, status string) (Maintenance, error) {
	if maintenanceID <= 0 {
		return Maintenance{}, ErrInvalidInput
	}
	status = strings.TrimSpace(status)
	if status == "" || !isValidStatus(status) {
		return Maintenance{}, ErrInvalidStatus
	}

	record, err := s.repo.GetMaintenanceByID(ctx, maintenanceID)
	if err != nil {
		return Maintenance{}, err
	}

	if err := s.repo.UpdateMaintenanceStatus(ctx, maintenanceID, status); err != nil {
		return Maintenance{}, err
	}

	switch status {
	case "InProgress":
		if _, err := s.queries.UpdateVehicleStatusByID(ctx, sqlc.UpdateVehicleStatusByIDParams{
			VehicleID: int32(record.VehicleID),
			Status: sqlc.NullVehiclesStatus{
				VehiclesStatus: sqlc.VehiclesStatusService,
				Valid:          true,
			},
		}); err != nil {
			return Maintenance{}, err
		}
	case "Completed":
		if _, err := s.queries.UpdateVehicleStatusByID(ctx, sqlc.UpdateVehicleStatusByIDParams{
			VehicleID: int32(record.VehicleID),
			Status: sqlc.NullVehiclesStatus{
				VehiclesStatus: sqlc.VehiclesStatusAvailable,
				Valid:          true,
			},
		}); err != nil {
			return Maintenance{}, err
		}
	}

	return s.repo.GetMaintenanceByID(ctx, maintenanceID)
}

func isValidType(t string) bool {
	switch t {
	case "Routine", "Repair", "TireChange":
		return true
	default:
		return false
	}
}

func isValidStatus(s string) bool {
	switch s {
	case "Scheduled", "InProgress", "Completed":
		return true
	default:
		return false
	}
}

