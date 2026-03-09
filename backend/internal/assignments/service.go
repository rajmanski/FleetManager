package assignments

import (
	"context"
	"time"
)

const (
	defaultListPage   int32 = 1
	defaultListLimit  int32 = 50
	maxListLimit      int32 = 100
	maxPastDays       int   = 30
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListAssignments(ctx context.Context, query ListAssignmentsQuery) (ListAssignmentsResponse, error) {
	page := query.Page
	limit := query.Limit
	if page <= 0 {
		page = defaultListPage
	}
	if limit <= 0 {
		limit = defaultListLimit
	}
	if limit > maxListLimit {
		return ListAssignmentsResponse{}, ErrInvalidInput
	}

	rows, total, err := s.repo.ListAssignments(ctx, ListAssignmentsQuery{
		ActiveOnly: query.ActiveOnly,
		Page:       page,
		Limit:      limit,
	})
	if err != nil {
		return ListAssignmentsResponse{}, err
	}

	return ListAssignmentsResponse{
		Data:  rows,
		Page:  page,
		Limit: limit,
		Total: total,
	}, nil
}

func (s *Service) CreateAssignment(ctx context.Context, req CreateAssignmentRequest) (Assignment, error) {
	if req.VehicleID <= 0 || req.DriverID <= 0 {
		return Assignment{}, ErrInvalidInput
	}

	assignedFrom := req.AssignedFrom.Truncate(time.Second)
	cutoff := time.Now().AddDate(0, 0, -maxPastDays)
	if assignedFrom.Before(cutoff) {
		return Assignment{}, ErrAssignedFromPast
	}

	vehicleExists, err := s.repo.VehicleExists(ctx, req.VehicleID)
	if err != nil {
		return Assignment{}, err
	}
	if !vehicleExists {
		return Assignment{}, ErrVehicleNotFound
	}

	driverExists, err := s.repo.DriverExists(ctx, req.DriverID)
	if err != nil {
		return Assignment{}, err
	}
	if !driverExists {
		return Assignment{}, ErrDriverNotFound
	}

	overlap, err := s.repo.HasDriverOverlappingAssignment(ctx, req.DriverID, assignedFrom)
	if err != nil {
		return Assignment{}, err
	}
	if overlap {
		return Assignment{}, ErrDriverOverlap
	}

	id, err := s.repo.CreateAssignment(ctx, CreateAssignmentRequest{
		VehicleID:    req.VehicleID,
		DriverID:     req.DriverID,
		AssignedFrom: assignedFrom,
	})
	if err != nil {
		return Assignment{}, err
	}

	return s.repo.GetAssignmentByID(ctx, id)
}

func (s *Service) EndAssignment(ctx context.Context, assignmentID int64) (Assignment, error) {
	if assignmentID <= 0 {
		return Assignment{}, ErrInvalidInput
	}

	_, err := s.repo.GetAssignmentByID(ctx, assignmentID)
	if err != nil {
		return Assignment{}, err
	}

	endTime := time.Now().Truncate(time.Second)
	if err := s.repo.EndAssignment(ctx, assignmentID, endTime); err != nil {
		return Assignment{}, err
	}

	return s.repo.GetAssignmentByID(ctx, assignmentID)
}

func (s *Service) GetVehicleAssignmentHistory(ctx context.Context, vehicleID int64) ([]AssignmentHistoryItem, error) {
	if vehicleID <= 0 {
		return nil, ErrInvalidInput
	}
	return s.repo.ListAssignmentsByVehicleID(ctx, vehicleID)
}

func (s *Service) GetDriverAssignmentHistory(ctx context.Context, driverID int64) ([]AssignmentHistoryItem, error) {
	if driverID <= 0 {
		return nil, ErrInvalidInput
	}
	return s.repo.ListAssignmentsByDriverID(ctx, driverID)
}
