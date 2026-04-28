package reports

import (
	"context"
	"fmt"
	"math"
	"strings"
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

	nextMonthStart := monthStart.AddDate(0, 1, 0)

	revenue, err := s.repo.GetVehicleRevenueForMonth(ctx, query.VehicleID, monthStart, nextMonthStart)
	if err != nil {
		return VehicleProfitabilityResponse{}, err
	}
	fuelCosts, err := s.repo.GetVehicleFuelCostsForMonth(ctx, query.VehicleID, monthStart, nextMonthStart)
	if err != nil {
		return VehicleProfitabilityResponse{}, err
	}
	maintenanceCosts, err := s.repo.GetVehicleMaintenanceCostsForMonth(ctx, query.VehicleID, monthStart, nextMonthStart)
	if err != nil {
		return VehicleProfitabilityResponse{}, err
	}
	insuranceCosts, err := s.repo.GetVehicleInsuranceMonthlyCost(ctx, query.VehicleID, monthStart, monthEnd)
	if err != nil {
		return VehicleProfitabilityResponse{}, err
	}
	tollsCosts, err := s.repo.GetVehicleTollsForMonth(ctx, query.VehicleID, monthStart, nextMonthStart)
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

func (s *Service) ExportVehicleProfitabilityXLSX(
	ctx context.Context,
	query VehicleProfitabilityQuery,
) ([]byte, string, error) {
	resp, err := s.GetVehicleProfitability(ctx, query)
	if err != nil {
		return nil, "", err
	}
	data, err := buildVehicleProfitabilityExcel(resp)
	if err != nil {
		return nil, "", err
	}
	filename := fmt.Sprintf("vehicle-profitability-%d-%s.xlsx", resp.VehicleID, resp.Month)
	return data, filename, nil
}

func (s *Service) GetDriverMileage(ctx context.Context, query DriverMileageQuery) (DriverMileageResponse, error) {
	if query.DriverID <= 0 {
		return DriverMileageResponse{}, ErrInvalidInput
	}
	from, to, err := parseDateRange(query.DateFrom, query.DateTo)
	if err != nil {
		return DriverMileageResponse{}, ErrInvalidInput
	}
	totalKm, ordersCount, err := s.repo.GetDriverMileageReport(ctx, query.DriverID, from, to)
	if err != nil {
		return DriverMileageResponse{}, err
	}
	period := formatDatePeriod(from, to)
	return DriverMileageResponse{
		DriverID:    query.DriverID,
		Period:      period,
		TotalKm:     int64(math.Round(totalKm)),
		OrdersCount: ordersCount,
	}, nil
}

func (s *Service) GetGlobalCosts(ctx context.Context, query GlobalCostsQuery) (GlobalCostsResponse, error) {
	from, to, err := parseDateRange(query.DateFrom, query.DateTo)
	if err != nil {
		return GlobalCostsResponse{}, ErrInvalidInput
	}

	cats, err := s.repo.GetGlobalCostsInRange(ctx, from, to)
	if err != nil {
		return GlobalCostsResponse{}, err
	}

	total := cats.Fuel + cats.Maintenance + cats.Insurance + cats.Tolls + cats.Other
	period := formatDatePeriod(from, to)
	return GlobalCostsResponse{
		Period:          period,
		CostsByCategory: cats,
		Total:           total,
	}, nil
}

func parseDateRange(dateFrom, dateTo string) (time.Time, time.Time, error) {
	from, err := time.Parse("2006-01-02", strings.TrimSpace(dateFrom))
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	to, err := time.Parse("2006-01-02", strings.TrimSpace(dateTo))
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	if from.After(to) {
		return time.Time{}, time.Time{}, ErrInvalidInput
	}
	return from, to, nil
}

func formatDatePeriod(from, to time.Time) string {
	return fmt.Sprintf("%s to %s", from.Format("2006-01-02"), to.Format("2006-01-02"))
}

func parseMonthBounds(month string) (time.Time, time.Time, error) {
	start, err := time.Parse("2006-01", month)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	end := start.AddDate(0, 1, -1)
	return start, end, nil
}
