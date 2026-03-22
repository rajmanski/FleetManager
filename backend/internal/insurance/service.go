package insurance

import (
	"context"
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

func (s *Service) ListInsurancePolicies(ctx context.Context, query ListInsuranceQuery) (ListInsuranceResponse, error) {
	page := query.Page
	limit := query.Limit
	if page <= 0 {
		page = defaultListPage
	}
	if limit <= 0 {
		limit = defaultListLimit
	}
	if limit > maxListLimit {
		return ListInsuranceResponse{}, ErrInvalidInput
	}
	if query.VehicleID < 0 {
		return ListInsuranceResponse{}, ErrInvalidInput
	}

	rows, total, err := s.repo.ListInsurancePolicies(ctx, ListInsuranceQuery{
		VehicleID: query.VehicleID,
		Page:      page,
		Limit:     limit,
	})
	if err != nil {
		return ListInsuranceResponse{}, err
	}

	return ListInsuranceResponse{
		Data:  rows,
		Page:  page,
		Limit: limit,
		Total: total,
	}, nil
}

func (s *Service) GetInsurancePolicyByID(ctx context.Context, id int64) (Policy, error) {
	if id <= 0 {
		return Policy{}, ErrInvalidInput
	}
	return s.repo.GetInsurancePolicyByID(ctx, id)
}

func (s *Service) CreateInsurancePolicy(ctx context.Context, req CreatePolicyRequest) (Policy, error) {
	if err := validatePolicyPayload(req.Type, req.VehicleID, req.StartDate, req.EndDate); err != nil {
		return Policy{}, err
	}
	start, end, err := parsePolicyDates(req.StartDate, req.EndDate)
	if err != nil {
		return Policy{}, ErrInvalidInput
	}
	if end.Before(start) {
		return Policy{}, ErrInvalidDateRange
	}

	id, errCreate := s.repo.CreateInsurancePolicy(ctx, CreatePolicyRequest{
		VehicleID:    req.VehicleID,
		Type:         strings.TrimSpace(req.Type),
		PolicyNumber: strings.TrimSpace(req.PolicyNumber),
		Insurer:      strings.TrimSpace(req.Insurer),
		StartDate:    req.StartDate,
		EndDate:      req.EndDate,
		Cost:         req.Cost,
	})
	if errCreate != nil {
		return Policy{}, errCreate
	}
	return s.repo.GetInsurancePolicyByID(ctx, id)
}

func (s *Service) UpdateInsurancePolicy(ctx context.Context, id int64, req UpdatePolicyRequest) (Policy, error) {
	if id <= 0 {
		return Policy{}, ErrInvalidInput
	}
	if err := validatePolicyPayload(req.Type, req.VehicleID, req.StartDate, req.EndDate); err != nil {
		return Policy{}, err
	}
	start, end, err := parsePolicyDates(req.StartDate, req.EndDate)
	if err != nil {
		return Policy{}, ErrInvalidInput
	}
	if end.Before(start) {
		return Policy{}, ErrInvalidDateRange
	}

	errUpdate := s.repo.UpdateInsurancePolicy(ctx, id, UpdatePolicyRequest{
		VehicleID:    req.VehicleID,
		Type:         strings.TrimSpace(req.Type),
		PolicyNumber: strings.TrimSpace(req.PolicyNumber),
		Insurer:      strings.TrimSpace(req.Insurer),
		StartDate:    req.StartDate,
		EndDate:      req.EndDate,
		Cost:         req.Cost,
	})
	if errUpdate != nil {
		return Policy{}, errUpdate
	}
	return s.repo.GetInsurancePolicyByID(ctx, id)
}

func (s *Service) DeleteInsurancePolicy(ctx context.Context, id int64) error {
	if id <= 0 {
		return ErrInvalidInput
	}
	return s.repo.DeleteInsurancePolicy(ctx, id)
}

func validatePolicyPayload(policyType string, vehicleID int64, start, end *string) error {
	if vehicleID <= 0 {
		return ErrInvalidInput
	}
	t := strings.TrimSpace(policyType)
	if !isValidPolicyType(t) {
		return ErrInvalidPolicyType
	}
	if start == nil || strings.TrimSpace(*start) == "" || end == nil || strings.TrimSpace(*end) == "" {
		return ErrInvalidInput
	}
	return nil
}

func isValidPolicyType(t string) bool {
	switch strings.TrimSpace(t) {
	case "OC", "AC":
		return true
	default:
		return false
	}
}

func parsePolicyDates(start, end *string) (time.Time, time.Time, error) {
	s, err := parseDateString(start)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	e, err := parseDateString(end)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	return s, e, nil
}

func parseDateString(s *string) (time.Time, error) {
	if s == nil {
		return time.Time{}, ErrInvalidInput
	}
	raw := strings.TrimSpace(*s)
	if raw == "" {
		return time.Time{}, ErrInvalidInput
	}
	t, err := time.Parse("2006-01-02", raw)
	if err != nil {
		return time.Time{}, err
	}
	return t, nil
}
