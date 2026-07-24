package maintenance

import (
	"context"
	"strings"

	"fleet-management/internal/dictionaries"
)

const (
	defaultListPage  int32 = 1
	defaultListLimit int32 = 50
	maxListLimit     int32 = 100
)

type Service struct {
	repo    Repository
	dictVal dictionaries.Validator
}

func NewService(repo Repository, dictVal dictionaries.Validator) *Service {
	return &Service{repo: repo, dictVal: dictVal}
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
	if status != "" && !s.isValidStatus(ctx, status) {
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
	if !s.isValidType(ctx, req.Type) {
		return Maintenance{}, ErrInvalidType
	}

	status := "Scheduled"
	if req.Status != nil {
		status = strings.TrimSpace(*req.Status)
	}
	if status == "" || !s.isValidStatus(ctx, status) {
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
	if !s.isValidType(ctx, req.Type) {
		return Maintenance{}, ErrInvalidType
	}

	status := "Scheduled"
	if req.Status != nil {
		status = strings.TrimSpace(*req.Status)
	}
	if status == "" || !s.isValidStatus(ctx, status) {
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
	if status == "" || !s.isValidStatus(ctx, status) {
		return Maintenance{}, ErrInvalidStatus
	}

	record, err := s.repo.GetMaintenanceByID(ctx, maintenanceID)
	if err != nil {
		return Maintenance{}, err
	}

	if err := s.repo.UpdateMaintenanceStatus(ctx, maintenanceID, status); err != nil {
		return Maintenance{}, err
	}

	if err := s.repo.UpdateVehicleStatus(ctx, record.VehicleID, status); err != nil {
		return Maintenance{}, err
	}

	return s.repo.GetMaintenanceByID(ctx, maintenanceID)
}

func (s *Service) isValidType(ctx context.Context, t string) bool {
	ok, err := s.dictVal.Exists(ctx, "maintenance_types", t)
	if err == nil && ok {
		return true
	}
	return isValidTypeHardcoded(t)
}

func (s *Service) isValidStatus(ctx context.Context, status string) bool {
	ok, err := s.dictVal.Exists(ctx, "maintenance_statuses", status)
	if err == nil && ok {
		return true
	}
	return isValidStatusHardcoded(status)
}

func isValidTypeHardcoded(t string) bool {
	switch t {
	case "Routine", "Repair", "TireChange":
		return true
	default:
		return false
	}
}

func isValidStatusHardcoded(s string) bool {
	switch s {
	case "Scheduled", "InProgress", "Completed":
		return true
	default:
		return false
	}
}

