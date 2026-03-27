package reports

import (
	"context"
	"time"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetVehicleProfitability(
	ctx context.Context,
	query VehicleProfitabilityQuery,
) (VehicleProfitabilityResponse, error) {
	if query.VehicleID <= 0 {
		return VehicleProfitabilityResponse{}, ErrInvalidInput
	}

	monthStart, monthEnd, err := parseMonthBounds(query.Month)
	if err != nil {
		return VehicleProfitabilityResponse{}, ErrInvalidInput
	}

	revenue, err := s.repo.GetVehicleRevenueForMonth(ctx, query.VehicleID, query.Month)
	if err != nil {
		return VehicleProfitabilityResponse{}, err
	}
	fuelCosts, err := s.repo.GetVehicleFuelCostsForMonth(ctx, query.VehicleID, query.Month)
	if err != nil {
		return VehicleProfitabilityResponse{}, err
	}
	maintenanceCosts, err := s.repo.GetVehicleMaintenanceCostsForMonth(ctx, query.VehicleID, query.Month)
	if err != nil {
		return VehicleProfitabilityResponse{}, err
	}
	insuranceCosts, err := s.repo.GetVehicleInsuranceMonthlyCost(ctx, query.VehicleID, monthStart, monthEnd)
	if err != nil {
		return VehicleProfitabilityResponse{}, err
	}
	tollsCosts, err := s.repo.GetVehicleTollsForMonth(ctx, query.VehicleID, query.Month)
	if err != nil {
		return VehicleProfitabilityResponse{}, err
	}

	totalCosts := fuelCosts + maintenanceCosts + insuranceCosts + tollsCosts
	profit := revenue - totalCosts

	return VehicleProfitabilityResponse{
		VehicleID: query.VehicleID,
		Month:     query.Month,
		Revenue:   revenue,
		Costs: VehicleProfitabilityCosts{
			Fuel:        fuelCosts,
			Maintenance: maintenanceCosts,
			Insurance:   insuranceCosts,
			Tolls:       tollsCosts,
			Total:       totalCosts,
		},
		Profit: profit,
	}, nil
}

func parseMonthBounds(month string) (time.Time, time.Time, error) {
	start, err := time.Parse("2006-01", month)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	end := start.AddDate(0, 1, -1)
	return start, end, nil
}
