package routes

import (
	"context"
	"math"
)

type WaypointsService struct {
	waypointsRepo WaypointsRepository
	routesRepo    RoutesRepository
}

type WaypointsRepository interface {
	ListWaypointsByRouteID(ctx context.Context, routeID int64) ([]Waypoint, error)
	GetWaypointByID(ctx context.Context, waypointID int64) (Waypoint, error)
	CountWaypointsByRouteID(ctx context.Context, routeID int64) (int64, error)
	GetMaxSequenceOrder(ctx context.Context, routeID int64) (int32, error)
	CreateWaypoint(ctx context.Context, wp CreateWaypointInput) (int64, error)
	UpdateWaypoint(ctx context.Context, wp UpdateWaypointInput) error
	DeleteWaypoint(ctx context.Context, waypointID int64) (deletedSequence int32, err error)
	GetWaypointRouteID(ctx context.Context, waypointID int64) (int64, error)
	ReorderWaypoints(ctx context.Context, routeID int64, updates []WaypointReorderItem) error
}

type RoutesRepository interface {
	GetRouteByID(ctx context.Context, routeID int64) (Route, error)
	HasActiveTripForOrder(ctx context.Context, orderID int64) (bool, error)
}

func NewWaypointsService(waypointsRepo WaypointsRepository, routesRepo RoutesRepository) *WaypointsService {
	return &WaypointsService{
		waypointsRepo: waypointsRepo,
		routesRepo:    routesRepo,
	}
}

func (s *WaypointsService) ListWaypoints(ctx context.Context, routeID int64) ([]Waypoint, error) {
	_, err := s.routesRepo.GetRouteByID(ctx, routeID)
	if err != nil {
		return nil, err
	}
	return s.waypointsRepo.ListWaypointsByRouteID(ctx, routeID)
}

func (s *WaypointsService) CreateWaypoint(ctx context.Context, routeID int64, req CreateWaypointRequest) (Waypoint, error) {
	route, err := s.routesRepo.GetRouteByID(ctx, routeID)
	if err != nil {
		return Waypoint{}, err
	}
	hasActive, err := s.routesRepo.HasActiveTripForOrder(ctx, route.OrderID)
	if err != nil {
		return Waypoint{}, err
	}
	if hasActive {
		return Waypoint{}, ErrRouteHasActiveTrip
	}
	count, err := s.waypointsRepo.CountWaypointsByRouteID(ctx, routeID)
	if err != nil {
		return Waypoint{}, err
	}
	if count >= maxWaypointsPerRoute {
		return Waypoint{}, ErrWaypointLimitExceeded
	}
	if err := validateWaypointInput(req.Address, req.Latitude, req.Longitude, req.ActionType); err != nil {
		return Waypoint{}, err
	}
	seqOrder := req.SequenceOrder
	if seqOrder <= 0 {
		maxSeq, _ := s.waypointsRepo.GetMaxSequenceOrder(ctx, routeID)
		seqOrder = maxSeq + 1
	}
	id, err := s.waypointsRepo.CreateWaypoint(ctx, CreateWaypointInput{
		RouteID:       routeID,
		SequenceOrder: seqOrder,
		Address:       req.Address,
		Latitude:      req.Latitude,
		Longitude:     req.Longitude,
		ActionType:    normalizeActionType(req.ActionType),
	})
	if err != nil {
		return Waypoint{}, err
	}
	return s.waypointsRepo.GetWaypointByID(ctx, id)
}

func (s *WaypointsService) UpdateWaypoint(ctx context.Context, waypointID int64, req UpdateWaypointRequest) (Waypoint, error) {
	routeID, err := s.waypointsRepo.GetWaypointRouteID(ctx, waypointID)
	if err != nil {
		return Waypoint{}, err
	}
	route, err := s.routesRepo.GetRouteByID(ctx, routeID)
	if err != nil {
		return Waypoint{}, err
	}
	hasActive, err := s.routesRepo.HasActiveTripForOrder(ctx, route.OrderID)
	if err != nil {
		return Waypoint{}, err
	}
	if hasActive {
		return Waypoint{}, ErrRouteHasActiveTrip
	}
	if err := validateWaypointInput(req.Address, req.Latitude, req.Longitude, req.ActionType); err != nil {
		return Waypoint{}, err
	}
	err = s.waypointsRepo.UpdateWaypoint(ctx, UpdateWaypointInput{
		WaypointID:    waypointID,
		SequenceOrder: req.SequenceOrder,
		Address:       req.Address,
		Latitude:      req.Latitude,
		Longitude:     req.Longitude,
		ActionType:    normalizeActionType(req.ActionType),
	})
	if err != nil {
		return Waypoint{}, err
	}
	return s.waypointsRepo.GetWaypointByID(ctx, waypointID)
}

func (s *WaypointsService) DeleteWaypoint(ctx context.Context, waypointID int64) error {
	routeID, err := s.waypointsRepo.GetWaypointRouteID(ctx, waypointID)
	if err != nil {
		return err
	}
	route, err := s.routesRepo.GetRouteByID(ctx, routeID)
	if err != nil {
		return err
	}
	hasActive, err := s.routesRepo.HasActiveTripForOrder(ctx, route.OrderID)
	if err != nil {
		return err
	}
	if hasActive {
		return ErrRouteHasActiveTrip
	}
	_, err = s.waypointsRepo.DeleteWaypoint(ctx, waypointID)
	return err
}

func (s *WaypointsService) ReorderWaypoints(ctx context.Context, updates []WaypointReorderItem) error {
	if len(updates) == 0 {
		return ErrInvalidWaypointInput
	}
	if err := ValidateReorderSequence(updates); err != nil {
		return err
	}
	routeID, err := s.waypointsRepo.GetWaypointRouteID(ctx, updates[0].WaypointID)
	if err != nil {
		return err
	}
	route, err := s.routesRepo.GetRouteByID(ctx, routeID)
	if err != nil {
		return err
	}
	hasActive, err := s.routesRepo.HasActiveTripForOrder(ctx, route.OrderID)
	if err != nil {
		return err
	}
	if hasActive {
		return ErrRouteHasActiveTrip
	}
	return s.waypointsRepo.ReorderWaypoints(ctx, routeID, updates)
}

func validateWaypointInput(address string, lat, lng float64, actionType string) error {
	if address == "" {
		return ErrInvalidWaypointInput
	}
	if lat < -90 || lat > 90 || math.IsNaN(lat) || math.IsInf(lat, 0) {
		return ErrInvalidWaypointInput
	}
	if lng < -180 || lng > 180 || math.IsNaN(lng) || math.IsInf(lng, 0) {
		return ErrInvalidWaypointInput
	}
	switch actionType {
	case ActionTypePickup, ActionTypeDropoff, ActionTypeStopover:
		// ok
	default:
		return ErrInvalidWaypointInput
	}
	return nil
}

func normalizeActionType(s string) string {
	switch s {
	case "Pickup", "pickup":
		return ActionTypePickup
	case "Dropoff", "dropoff":
		return ActionTypeDropoff
	case "Stopover", "stopover":
		return ActionTypeStopover
	default:
		return ActionTypeStopover
	}
}

type CreateWaypointRequest struct {
	SequenceOrder int32   `json:"sequence_order"`
	Address       string  `json:"address"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	ActionType    string  `json:"action_type"`
}

type UpdateWaypointRequest struct {
	SequenceOrder int32   `json:"sequence_order"`
	Address       string  `json:"address"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	ActionType    string  `json:"action_type"`
}

type ReorderWaypointsRequest struct {
	Waypoints []struct {
		WaypointID    int64 `json:"waypoint_id"`
		SequenceOrder int32 `json:"sequence_order"`
	} `json:"waypoints"`
}

// ValidateReorderSequence checks that sequence_order is continuous (1,2,3...)
func ValidateReorderSequence(updates []WaypointReorderItem) error {
	if len(updates) == 0 {
		return nil
	}
	seen := make(map[int32]bool)
	for _, u := range updates {
		if u.SequenceOrder < 1 {
			return ErrInvalidWaypointInput
		}
		if seen[u.SequenceOrder] {
			return ErrInvalidWaypointInput
		}
		seen[u.SequenceOrder] = true
	}
	// Check continuity: must have 1..n
	for i := 1; i <= len(updates); i++ {
		if !seen[int32(i)] {
			return ErrInvalidWaypointInput
		}
	}
	return nil
}
