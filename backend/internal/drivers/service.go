package drivers

import (
	"context"
	"fmt"
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

func (s *Service) ListDrivers(ctx context.Context, query ListDriversQuery) (ListDriversResponse, error) {
	page := query.Page
	limit := query.Limit
	if page <= 0 {
		page = defaultListPage
	}
	if limit <= 0 {
		limit = defaultListLimit
	}
	if limit > maxListLimit {
		return ListDriversResponse{}, ErrInvalidInput
	}

	status := strings.TrimSpace(query.Status)
	if status != "" && !isAllowedDriverStatus(status) {
		return ListDriversResponse{}, ErrInvalidStatus
	}
	search := strings.TrimSpace(query.Search)

	rows, total, err := s.repo.ListDrivers(ctx, ListDriversQuery{
		Status:         status,
		Search:         search,
		IncludeDeleted: query.IncludeDeleted,
		Page:           page,
		Limit:          limit,
	})
	if err != nil {
		return ListDriversResponse{}, err
	}

	return ListDriversResponse{
		Data:  rows,
		Page:  page,
		Limit: limit,
		Total: total,
	}, nil
}

func (s *Service) GetDriverByID(ctx context.Context, driverID int64) (Driver, error) {
	if driverID <= 0 {
		return Driver{}, ErrInvalidInput
	}
	return s.repo.GetDriverByID(ctx, driverID)
}

func (s *Service) CreateDriver(ctx context.Context, req CreateDriverRequest) (Driver, error) {
	pesel := strings.TrimSpace(req.PESEL)
	if err := ValidatePESEL(pesel); err != nil {
		return Driver{}, err
	}

	status := strings.TrimSpace(req.Status)
	if status == "" {
		status = "Available"
	}
	if !isAllowedDriverStatus(status) {
		return Driver{}, ErrInvalidStatus
	}

	req.PESEL = pesel
	req.Status = status
	id, err := s.repo.CreateDriver(ctx, req)
	if err != nil {
		return Driver{}, err
	}
	return s.repo.GetDriverByID(ctx, id)
}

func (s *Service) UpdateDriver(ctx context.Context, driverID int64, req UpdateDriverRequest) (Driver, error) {
	if driverID <= 0 {
		return Driver{}, ErrInvalidInput
	}

	pesel := strings.TrimSpace(req.PESEL)
	if err := ValidatePESEL(pesel); err != nil {
		return Driver{}, err
	}

	status := strings.TrimSpace(req.Status)
	if !isAllowedDriverStatus(status) {
		return Driver{}, ErrInvalidStatus
	}

	existing, err := s.repo.GetDriverByID(ctx, driverID)
	if err != nil {
		return Driver{}, err
	}

	// adr_expiry_date can only be set when adr_certified is true
	effectiveADRCertified := existing.ADRCertified
	if req.ADRCertified != nil {
		effectiveADRCertified = *req.ADRCertified
	}
	if req.ADRExpiryDate != nil && !effectiveADRCertified {
		return Driver{}, ErrInvalidCertificates
	}

	req.PESEL = pesel
	req.Status = status
	if err := s.repo.UpdateDriver(ctx, driverID, req, existing); err != nil {
		return Driver{}, err
	}

	return s.repo.GetDriverByID(ctx, driverID)
}

func (s *Service) DeleteDriver(ctx context.Context, driverID int64) error {
	if driverID <= 0 {
		return ErrInvalidInput
	}
	return s.repo.DeleteDriver(ctx, driverID)
}

func (s *Service) RestoreDriver(ctx context.Context, driverID int64) (Driver, error) {
	if driverID <= 0 {
		return Driver{}, ErrInvalidInput
	}

	if err := s.repo.RestoreDriver(ctx, driverID); err != nil {
		return Driver{}, err
	}
	return s.repo.GetDriverByID(ctx, driverID)
}

func isAllowedDriverStatus(status string) bool {
	switch status {
	case "Available", "OnLeave", "InRoute":
		return true
	default:
		return false
	}
}

func (s *Service) GetDriverAvailability(ctx context.Context, driverID int64, date string) (DriverAvailabilityResponse, error) {
	if driverID <= 0 {
		return DriverAvailabilityResponse{}, ErrInvalidInput
	}
	date = strings.TrimSpace(date)
	if date == "" {
		return DriverAvailabilityResponse{}, ErrInvalidInput
	}

	_, err := s.repo.GetDriverByID(ctx, driverID)
	if err != nil {
		return DriverAvailabilityResponse{}, err
	}

	orderNumber, err := s.repo.GetDriverTripOrderNumberOnDate(ctx, driverID, date)
	if err != nil {
		return DriverAvailabilityResponse{}, err
	}

	resp := DriverAvailabilityResponse{
		DriverID:  driverID,
		Date:      date,
		Available: orderNumber == "",
	}
	if orderNumber != "" {
		reason := fmt.Sprintf("Assigned to order %s", orderNumber)
		resp.Reason = &reason
	}
	return resp, nil
}
