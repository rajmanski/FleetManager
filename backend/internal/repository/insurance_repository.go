package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/insurance"
)

type InsuranceRepository struct {
	queries sqlc.Querier
}

func NewInsuranceRepository(queries sqlc.Querier) *InsuranceRepository {
	return &InsuranceRepository{queries: queries}
}

func (r *InsuranceRepository) ListInsurancePolicies(ctx context.Context, query insurance.ListInsuranceQuery) ([]insurance.Policy, int64, error) {
	offset := (query.Page - 1) * query.Limit

	vehicleFilter := interface{}(0)
	vehicleID := int32(0)
	if query.VehicleID > 0 {
		vehicleFilter = 1
		vehicleID = int32(query.VehicleID)
	}

	rows, err := r.queries.ListInsurancePolicy(ctx, sqlc.ListInsurancePolicyParams{
		Column1:   vehicleFilter,
		VehicleID: vehicleID,
		Limit:     query.Limit,
		Offset:    offset,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountInsurancePolicy(ctx, sqlc.CountInsurancePolicyParams{
		Column1:   vehicleFilter,
		VehicleID: vehicleID,
	})
	if err != nil {
		return nil, 0, err
	}

	out := make([]insurance.Policy, 0, len(rows))
	for _, row := range rows {
		out = append(out, mapInsurancePolicyRow(row))
	}
	return out, total, nil
}

func (r *InsuranceRepository) GetInsurancePolicyByID(ctx context.Context, id int64) (insurance.Policy, error) {
	row, err := r.queries.GetInsurancePolicyByID(ctx, int32(id))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return insurance.Policy{}, insurance.ErrPolicyNotFound
		}
		return insurance.Policy{}, err
	}
	return mapInsurancePolicyRow(row), nil
}

func (r *InsuranceRepository) CreateInsurancePolicy(ctx context.Context, input insurance.CreatePolicyRequest) (int64, error) {
	start, err := insurancePolicyDateFromPtr(input.StartDate)
	if err != nil {
		return 0, err
	}
	end, err := insurancePolicyDateFromPtr(input.EndDate)
	if err != nil {
		return 0, err
	}

	policyType := strings.TrimSpace(input.Type)
	if policyType == "" {
		return 0, insurance.ErrInvalidPolicyType
	}

	return r.queries.CreateInsurancePolicy(ctx, sqlc.CreateInsurancePolicyParams{
		VehicleID:    int32(input.VehicleID),
		Type:         sqlc.InsurancepolicyType(policyType),
		PolicyNumber: strings.TrimSpace(input.PolicyNumber),
		Insurer:      strings.TrimSpace(input.Insurer),
		StartDate:    start,
		EndDate:      end,
		Cost:         fmt.Sprintf("%.2f", input.Cost),
	})
}

func (r *InsuranceRepository) UpdateInsurancePolicy(ctx context.Context, id int64, input insurance.UpdatePolicyRequest) error {
	start, err := insurancePolicyDateFromPtr(input.StartDate)
	if err != nil {
		return err
	}
	end, err := insurancePolicyDateFromPtr(input.EndDate)
	if err != nil {
		return err
	}

	policyType := strings.TrimSpace(input.Type)
	if policyType == "" {
		return insurance.ErrInvalidPolicyType
	}

	rows, err := r.queries.UpdateInsurancePolicy(ctx, sqlc.UpdateInsurancePolicyParams{
		VehicleID:    int32(input.VehicleID),
		Type:         sqlc.InsurancepolicyType(policyType),
		PolicyNumber: strings.TrimSpace(input.PolicyNumber),
		Insurer:      strings.TrimSpace(input.Insurer),
		StartDate:    start,
		EndDate:      end,
		Cost:         fmt.Sprintf("%.2f", input.Cost),
		ID:           int32(id),
	})
	if err != nil {
		return err
	}
	if rows == 0 {
		return insurance.ErrPolicyNotFound
	}
	return nil
}

func (r *InsuranceRepository) DeleteInsurancePolicy(ctx context.Context, id int64) error {
	rows, err := r.queries.DeleteInsurancePolicy(ctx, int32(id))
	if err != nil {
		return err
	}
	if rows == 0 {
		return insurance.ErrPolicyNotFound
	}
	return nil
}

func mapInsurancePolicyRow(row sqlc.Insurancepolicy) insurance.Policy {
	var created, updated *time.Time
	if row.CreatedAt.Valid {
		t := row.CreatedAt.Time
		created = &t
	}
	if row.UpdatedAt.Valid {
		t := row.UpdatedAt.Time
		updated = &t
	}
	var cost float64
	_, _ = fmt.Sscanf(row.Cost, "%f", &cost)
	return insurance.Policy{
		ID:           int64(row.ID),
		VehicleID:    int64(row.VehicleID),
		Type:         string(row.Type),
		PolicyNumber: row.PolicyNumber,
		Insurer:      row.Insurer,
		StartDate:    row.StartDate,
		EndDate:      row.EndDate,
		Cost:         cost,
		CreatedAt:    created,
		UpdatedAt:    updated,
	}
}

func insurancePolicyDateFromPtr(s *string) (time.Time, error) {
	if s == nil {
		return time.Time{}, insurance.ErrInvalidInput
	}
	raw := strings.TrimSpace(*s)
	if raw == "" {
		return time.Time{}, insurance.ErrInvalidInput
	}
	t, err := time.Parse("2006-01-02", raw)
	if err != nil {
		return time.Time{}, err
	}
	return t, nil
}
var _ insurance.Repository = (*InsuranceRepository)(nil)
