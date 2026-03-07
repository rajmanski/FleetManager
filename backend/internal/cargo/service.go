package cargo

import (
	"context"
	"strings"
)

var allowedCargoTypes = map[string]bool{
	"General": true, "Refrigerated": true, "Hazardous": true,
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListCargo(ctx context.Context, orderID int64) ([]Cargo, error) {
	if orderID <= 0 {
		return nil, ErrInvalidInput
	}
	rows, err := s.repo.ListCargoByOrderID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	result := make([]Cargo, 0, len(rows))
	for _, r := range rows {
		result = append(result, rowToCargo(r))
	}
	return result, nil
}

func (s *Service) GetCargoByID(ctx context.Context, cargoID int64) (Cargo, error) {
	if cargoID <= 0 {
		return Cargo{}, ErrInvalidInput
	}
	row, found, err := s.repo.GetCargoByID(ctx, cargoID)
	if err != nil {
		return Cargo{}, err
	}
	if !found {
		return Cargo{}, ErrCargoNotFound
	}
	return rowToCargo(row), nil
}

func (s *Service) CreateCargo(ctx context.Context, orderID int64, req CreateCargoRequest) (Cargo, error) {
	if orderID <= 0 {
		return Cargo{}, ErrInvalidInput
	}
	if err := validateCargoRequest(req.WeightKg, req.VolumeM3, req.CargoType); err != nil {
		return Cargo{}, err
	}
	id, err := s.repo.CreateCargo(ctx, orderID, strings.TrimSpace(req.Description), req.WeightKg, req.VolumeM3, req.CargoType)
	if err != nil {
		return Cargo{}, err
	}
	return s.GetCargoByID(ctx, id)
}

func (s *Service) UpdateCargo(ctx context.Context, cargoID int64, req UpdateCargoRequest) (Cargo, error) {
	if cargoID <= 0 {
		return Cargo{}, ErrInvalidInput
	}
	if err := validateCargoRequest(req.WeightKg, req.VolumeM3, req.CargoType); err != nil {
		return Cargo{}, err
	}
	_, found, err := s.repo.GetCargoByID(ctx, cargoID)
	if err != nil {
		return Cargo{}, err
	}
	if !found {
		return Cargo{}, ErrCargoNotFound
	}
	status, err := s.repo.GetOrderStatusByCargoID(ctx, cargoID)
	if err != nil {
		return Cargo{}, err
	}
	if status == "InProgress" {
		return Cargo{}, ErrOrderInProgress
	}
	rows, err := s.repo.UpdateCargo(ctx, cargoID, strings.TrimSpace(req.Description), req.WeightKg, req.VolumeM3, req.CargoType)
	if err != nil {
		return Cargo{}, err
	}
	if rows == 0 {
		return Cargo{}, ErrCargoNotFound
	}
	return s.GetCargoByID(ctx, cargoID)
}

func (s *Service) DeleteCargo(ctx context.Context, cargoID int64) error {
	if cargoID <= 0 {
		return ErrInvalidInput
	}
	_, found, err := s.repo.GetCargoByID(ctx, cargoID)
	if err != nil {
		return err
	}
	if !found {
		return ErrCargoNotFound
	}
	status, err := s.repo.GetOrderStatusByCargoID(ctx, cargoID)
	if err != nil {
		return err
	}
	if status == "InProgress" {
		return ErrOrderInProgress
	}
	rows, err := s.repo.DeleteCargo(ctx, cargoID)
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrCargoNotFound
	}
	return nil
}

func validateCargoRequest(weightKg, volumeM3 float64, cargoType string) error {
	if weightKg <= 0 {
		return ErrInvalidInput
	}
	if volumeM3 <= 0 {
		return ErrInvalidInput
	}
	cargoType = strings.TrimSpace(cargoType)
	if cargoType == "" || !allowedCargoTypes[cargoType] {
		return ErrInvalidInput
	}
	return nil
}

func (s *Service) AssignWaypoint(ctx context.Context, cargoID int64, req AssignWaypointRequest) (Cargo, error) {
	if cargoID <= 0 {
		return Cargo{}, ErrInvalidInput
	}
	_, found, err := s.repo.GetCargoByID(ctx, cargoID)
	if err != nil {
		return Cargo{}, err
	}
	if !found {
		return Cargo{}, ErrCargoNotFound
	}
	if req.DestinationWaypointID != nil && *req.DestinationWaypointID > 0 {
		belongs, err := s.repo.WaypointBelongsToCargoOrder(ctx, cargoID, *req.DestinationWaypointID)
		if err != nil {
			return Cargo{}, err
		}
		if !belongs {
			return Cargo{}, ErrWaypointNotInOrderRoute
		}
	}
	rows, err := s.repo.AssignCargoWaypoint(ctx, cargoID, req.DestinationWaypointID)
	if err != nil {
		return Cargo{}, err
	}
	if rows == 0 {
		return Cargo{}, ErrCargoNotFound
	}
	return s.GetCargoByID(ctx, cargoID)
}

func rowToCargo(r CargoRow) Cargo {
	c := Cargo{
		ID:          r.ID,
		OrderID:     r.OrderID,
		Description: r.Description,
		WeightKg:    r.WeightKg,
		VolumeM3:    r.VolumeM3,
		CargoType:   r.CargoType,
	}
	if r.DestinationWaypointID != nil {
		c.DestinationWaypointID = r.DestinationWaypointID
	}
	return c
}
