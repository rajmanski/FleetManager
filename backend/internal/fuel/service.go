package fuel

import (
	"context"
	"errors"
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

func (s *Service) CreateFuelLog(ctx context.Context, req CreateFuelRequest) (CreateFuelResponse, error) {
	location := strings.TrimSpace(req.Location)
	if location == "" {
		return CreateFuelResponse{}, ErrInvalidInput
	}

	if req.VehicleID <= 0 || req.Mileage < 0 || req.Liters < 0 || req.PricePerLiter < 0 {
		return CreateFuelResponse{}, ErrInvalidInput
	}

	date, err := parseDate(req.Date)
	if err != nil {
		return CreateFuelResponse{}, ErrInvalidInput
	}

	prevMileage, err := s.repo.GetVehicleCurrentMileage(ctx, req.VehicleID)
	if err != nil {
		if errors.Is(err, ErrVehicleNotFound) {
			return CreateFuelResponse{}, err
		}
		return CreateFuelResponse{}, err
	}

	if req.Mileage < prevMileage {
		return CreateFuelResponse{}, ErrInvalidInput
	}

	deltaKm := req.Mileage - prevMileage
	if deltaKm <= 0 {
		return CreateFuelResponse{}, ErrInvalidInput
	}

	totalCost := req.Liters * req.PricePerLiter
	currentConsumption := (req.Liters / float64(deltaKm)) * 100

	alert := (*FuelAlert)(nil)

	avgNorm, err := s.repo.GetAvgFuelConsumptionPer100Km(ctx, req.VehicleID)
	if err != nil {
		return CreateFuelResponse{}, err
	}
	if avgNorm != nil && *avgNorm > 0 {
		deviationPercent := math.Abs(currentConsumption-*avgNorm) / *avgNorm * 100
		if deviationPercent > 20 {
			roundedDeviation := math.Round(deviationPercent)
			var msg string
			if currentConsumption >= *avgNorm {
				msg = fmt.Sprintf("Zużycie o %.0f%% wyższe niż norma", roundedDeviation)
			} else {
				msg = fmt.Sprintf("Zużycie o %.0f%% niższe niż norma", roundedDeviation)
			}

			alert = &FuelAlert{
				Type:    "high_consumption",
				Message: msg,
			}
		}
	}

	fuelID, err := s.repo.CreateFuelLogAndUpdate(ctx, CreateFuelRepositoryInput{
		VehicleID:     req.VehicleID,
		Date:          date,
		Liters:        req.Liters,
		PricePerLiter: req.PricePerLiter,
		TotalCost:     totalCost,
		Mileage:       req.Mileage,
		Location:      location,
	}, func() *CreateFuelAlertInput {
		if alert == nil {
			return nil
		}
		return &CreateFuelAlertInput{AlertType: alert.Type, Message: alert.Message}
	}())
	if err != nil {
		return CreateFuelResponse{}, err
	}

	return CreateFuelResponse{
		FuelLogID:           fuelID,
		TotalCost:           totalCost,
		ConsumptionPer100km: currentConsumption,
		Alert:               alert,
	}, nil
}

func parseDate(dateStr string) (time.Time, error) {
	d := strings.TrimSpace(dateStr)
	if d == "" {
		return time.Time{}, fmt.Errorf("empty date")
	}
	return time.Parse("2006-01-02", d)
}

const (
	defaultListPage  int32 = 1
	defaultListLimit int32 = 50
	maxListLimit     int32 = 100
)

func (s *Service) ListFuelLogs(ctx context.Context, query ListFuelLogsQuery) (ListFuelLogsResponse, error) {
	page := query.Page
	limit := query.Limit
	if page <= 0 {
		page = defaultListPage
	}
	if limit <= 0 {
		limit = defaultListLimit
	}
	if limit > maxListLimit {
		return ListFuelLogsResponse{}, ErrInvalidInput
	}

	vehicleID := query.VehicleID
	if vehicleID < 0 {
		return ListFuelLogsResponse{}, ErrInvalidInput
	}

	dateFromStr := strings.TrimSpace(query.DateFrom)
	dateToStr := strings.TrimSpace(query.DateTo)

	var fromTime, toTime time.Time
	var err error
	if dateFromStr != "" {
		fromTime, err = parseDate(dateFromStr)
		if err != nil {
			return ListFuelLogsResponse{}, ErrInvalidInput
		}
	}
	if dateToStr != "" {
		toTime, err = parseDate(dateToStr)
		if err != nil {
			return ListFuelLogsResponse{}, ErrInvalidInput
		}
	}
	if dateFromStr != "" && dateToStr != "" && toTime.Before(fromTime) {
		return ListFuelLogsResponse{}, ErrInvalidInput
	}

	rows, total, err := s.repo.ListFuelLogs(ctx, ListFuelLogsQuery{
		VehicleID: vehicleID,
		DateFrom:  dateFromStr,
		DateTo:    dateToStr,
		Page:       page,
		Limit:      limit,
	})
	if err != nil {
		return ListFuelLogsResponse{}, err
	}

	return ListFuelLogsResponse{
		Data:  rows,
		Page:  page,
		Limit: limit,
		Total: total,
	}, nil
}

