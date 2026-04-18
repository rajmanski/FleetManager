package operations

import (
	"context"
	"fmt"
	"strings"
	"time"

	"fleet-management/internal/cargo"
	"fleet-management/internal/orders"
	"fleet-management/internal/trips"
	"fleet-management/internal/waypoints"
)

type OrdersService interface {
	CreateOrder(ctx context.Context, req orders.CreateOrderRequest) (orders.Order, error)
}

type CargoService interface {
	CreateCargo(ctx context.Context, orderID int64, req cargo.CreateCargoRequest) (cargo.Cargo, error)
	AssignWaypoint(ctx context.Context, cargoID int64, req cargo.AssignWaypointRequest) (cargo.Cargo, error)
}

type WaypointsService interface {
	CreateWaypoint(ctx context.Context, routeID int64, req waypoints.CreateWaypointRequest) (waypoints.Waypoint, error)
}

type TripsService interface {
	CreateTrip(ctx context.Context, req trips.CreateTripRequest) (trips.Trip, error)
}

type RouteStore interface {
	CreateRoute(
		ctx context.Context,
		orderID int64,
		startLocation string,
		endLocation string,
		plannedDistanceKm *float64,
		estimatedTimeMin *int32,
	) (int64, error)
}

type Service struct {
	ordersSvc    OrdersService
	cargoSvc     CargoService
	waypointsSvc WaypointsService
	tripsSvc     TripsService
	routeStore   RouteStore
}

func NewService(
	ordersSvc OrdersService,
	cargoSvc CargoService,
	waypointsSvc WaypointsService,
	tripsSvc TripsService,
	routeStore RouteStore,
) *Service {
	return &Service{
		ordersSvc:    ordersSvc,
		cargoSvc:     cargoSvc,
		waypointsSvc: waypointsSvc,
		tripsSvc:     tripsSvc,
		routeStore:   routeStore,
	}
}

func (s *Service) CreatePlannedOrderWorkflow(
	ctx context.Context,
	req PlanOrderWorkflowRequest,
) (PlanOrderWorkflowResponse, error) {
	if verr := validateWorkflowRequest(req); verr != nil {
		return PlanOrderWorkflowResponse{}, verr
	}

	plannedStatus := "Planned"
	order, err := s.ordersSvc.CreateOrder(ctx, orders.CreateOrderRequest{
		ClientID:         req.Order.ClientID,
		OrderNumber:      strings.TrimSpace(req.Order.OrderNumber),
		DeliveryDeadline: req.Order.DeliveryDeadline,
		TotalPricePln:    req.Order.TotalPricePln,
		Status:           &plannedStatus,
	})
	if err != nil {
		return PlanOrderWorkflowResponse{}, err
	}

	routeID, err := s.routeStore.CreateRoute(
		ctx,
		order.ID,
		strings.TrimSpace(req.Route.StartLocation),
		strings.TrimSpace(req.Route.EndLocation),
		req.Route.PlannedDistanceKm,
		req.Route.EstimatedTimeMin,
	)
	if err != nil {
		return PlanOrderWorkflowResponse{}, err
	}

	waypointByTempID := make(map[string]int64, len(req.Route.Waypoints))
	for _, wp := range req.Route.Waypoints {
		createdWaypoint, createErr := s.waypointsSvc.CreateWaypoint(ctx, routeID, waypoints.CreateWaypointRequest{
			SequenceOrder: wp.SequenceOrder,
			Address:       strings.TrimSpace(wp.Address),
			Latitude:      wp.Latitude,
			Longitude:     wp.Longitude,
			ActionType:    strings.TrimSpace(wp.ActionType),
		})
		if createErr != nil {
			return PlanOrderWorkflowResponse{}, createErr
		}
		waypointByTempID[wp.TempID] = createdWaypoint.WaypointID
	}

	totalWeight := 0.0
	for _, c := range req.Cargo {
		createdCargo, createErr := s.cargoSvc.CreateCargo(ctx, order.ID, cargo.CreateCargoRequest{
			Description: strings.TrimSpace(c.Description),
			WeightKg:    c.WeightKg,
			VolumeM3:    c.VolumeM3,
			CargoType:   strings.TrimSpace(c.CargoType),
		})
		if createErr != nil {
			return PlanOrderWorkflowResponse{}, createErr
		}

		totalWeight += c.WeightKg

		if c.DestinationWaypointTempID != nil && strings.TrimSpace(*c.DestinationWaypointTempID) != "" {
			tempID := strings.TrimSpace(*c.DestinationWaypointTempID)
			waypointID, ok := waypointByTempID[tempID]
			if !ok {
				return PlanOrderWorkflowResponse{}, &ValidationError{
					Message: "workflow validation failed",
					FieldErrors: []FieldError{
						{
							Field:   "cargo.destination_waypoint_temp_id",
							Code:    "WAYPOINT_REFERENCE_NOT_FOUND",
							Message: fmt.Sprintf("waypoint temp_id %q does not exist", tempID),
						},
					},
				}
			}
			if _, assignErr := s.cargoSvc.AssignWaypoint(ctx, createdCargo.ID, cargo.AssignWaypointRequest{
				DestinationWaypointID: &waypointID,
			}); assignErr != nil {
				return PlanOrderWorkflowResponse{}, assignErr
			}
		}
	}

	tripStartTime, err := time.Parse(time.RFC3339, strings.TrimSpace(req.Trip.StartTime))
	if err != nil {
		return PlanOrderWorkflowResponse{}, &ValidationError{
			Message: "workflow validation failed",
			FieldErrors: []FieldError{
				{
					Field:   "trip.start_time",
					Code:    "INVALID_DATETIME",
					Message: "trip.start_time must be a valid RFC3339 datetime",
				},
			},
		}
	}

	createdTrip, err := s.tripsSvc.CreateTrip(ctx, trips.CreateTripRequest{
		OrderID:   order.ID,
		VehicleID: req.Trip.VehicleID,
		DriverID:  req.Trip.DriverID,
		StartTime: tripStartTime,
	})
	if err != nil {
		return PlanOrderWorkflowResponse{}, err
	}

	var distanceKm float64
	if req.Route.PlannedDistanceKm != nil {
		distanceKm = *req.Route.PlannedDistanceKm
	}
	var estimatedMinutes int32
	if req.Route.EstimatedTimeMin != nil {
		estimatedMinutes = *req.Route.EstimatedTimeMin
	}

	response := PlanOrderWorkflowResponse{
		Status: "planned",
		Order: PlannedOrderSummary{
			ID:          order.ID,
			OrderNumber: order.OrderNumber,
			Status:      order.Status,
		},
		Route: PlannedRouteSummary{
			ID:                routeID,
			PlannedDistanceKm: req.Route.PlannedDistanceKm,
			EstimatedTimeMin:  req.Route.EstimatedTimeMin,
		},
		Trip: PlannedTripSummary{
			ID:        createdTrip.ID,
			Status:    createdTrip.Status,
			VehicleID: createdTrip.VehicleID,
			DriverID:  createdTrip.DriverID,
			StartTime: tripStartTime.UTC().Format(time.RFC3339),
		},
		Summary: PlannedOrderOverview{
			CargoCount:       len(req.Cargo),
			TotalWeightKg:    totalWeight,
			WaypointsCount:   len(req.Route.Waypoints),
			DistanceKm:       distanceKm,
			EstimatedTimeMin: estimatedMinutes,
		},
	}

	return response, nil
}

func validateWorkflowRequest(req PlanOrderWorkflowRequest) *ValidationError {
	verr := &ValidationError{Message: "workflow validation failed"}

	if req.Order.ClientID <= 0 {
		verr.FieldErrors = append(verr.FieldErrors, FieldError{
			Field:   "order.client_id",
			Code:    "REQUIRED",
			Message: "order.client_id must be greater than 0",
		})
	}
	if strings.TrimSpace(req.Order.OrderNumber) == "" {
		verr.FieldErrors = append(verr.FieldErrors, FieldError{
			Field:   "order.order_number",
			Code:    "REQUIRED",
			Message: "order.order_number is required",
		})
	}

	if strings.TrimSpace(req.Route.StartLocation) == "" {
		verr.FieldErrors = append(verr.FieldErrors, FieldError{
			Field:   "route.start_location",
			Code:    "REQUIRED",
			Message: "route.start_location is required",
		})
	}
	if strings.TrimSpace(req.Route.EndLocation) == "" {
		verr.FieldErrors = append(verr.FieldErrors, FieldError{
			Field:   "route.end_location",
			Code:    "REQUIRED",
			Message: "route.end_location is required",
		})
	}

	if len(req.Route.Waypoints) == 0 {
		verr.GlobalErrors = append(verr.GlobalErrors, FieldError{
			Code:    "WAYPOINTS_REQUIRED",
			Message: "at least one waypoint is required",
		})
	}
	if len(req.Route.Waypoints) > 10 {
		verr.GlobalErrors = append(verr.GlobalErrors, FieldError{
			Code:    "WAYPOINTS_LIMIT",
			Message: "maximum number of waypoints is 10",
		})
	}

	seqSeen := make(map[int32]bool, len(req.Route.Waypoints))
	tempIDSeen := make(map[string]bool, len(req.Route.Waypoints))
	for idx, wp := range req.Route.Waypoints {
		fieldPrefix := fmt.Sprintf("route.waypoints[%d]", idx)
		if strings.TrimSpace(wp.TempID) == "" {
			verr.FieldErrors = append(verr.FieldErrors, FieldError{
				Field:   fieldPrefix + ".temp_id",
				Code:    "REQUIRED",
				Message: "temp_id is required",
			})
		}
		if strings.TrimSpace(wp.TempID) != "" {
			if tempIDSeen[wp.TempID] {
				verr.FieldErrors = append(verr.FieldErrors, FieldError{
					Field:   fieldPrefix + ".temp_id",
					Code:    "DUPLICATE",
					Message: "temp_id must be unique",
				})
			}
			tempIDSeen[wp.TempID] = true
		}
		if wp.SequenceOrder < 1 {
			verr.FieldErrors = append(verr.FieldErrors, FieldError{
				Field:   fieldPrefix + ".sequence_order",
				Code:    "INVALID",
				Message: "sequence_order must be greater than 0",
			})
		}
		if wp.SequenceOrder > 0 {
			if seqSeen[wp.SequenceOrder] {
				verr.FieldErrors = append(verr.FieldErrors, FieldError{
					Field:   fieldPrefix + ".sequence_order",
					Code:    "DUPLICATE",
					Message: "sequence_order must be unique",
				})
			}
			seqSeen[wp.SequenceOrder] = true
		}
	}

	for i := 1; i <= len(req.Route.Waypoints); i++ {
		if !seqSeen[int32(i)] {
			verr.GlobalErrors = append(verr.GlobalErrors, FieldError{
				Code:    "SEQUENCE_INVALID",
				Message: "waypoint sequence_order must be continuous",
			})
			break
		}
	}

	if len(req.Cargo) == 0 {
		verr.GlobalErrors = append(verr.GlobalErrors, FieldError{
			Code:    "CARGO_REQUIRED",
			Message: "at least one cargo item is required",
		})
	}

	for idx, c := range req.Cargo {
		fieldPrefix := fmt.Sprintf("cargo[%d]", idx)
		if c.WeightKg <= 0 {
			verr.FieldErrors = append(verr.FieldErrors, FieldError{
				Field:   fieldPrefix + ".weight_kg",
				Code:    "INVALID",
				Message: "weight_kg must be greater than 0",
			})
		}
		if c.VolumeM3 <= 0 {
			verr.FieldErrors = append(verr.FieldErrors, FieldError{
				Field:   fieldPrefix + ".volume_m3",
				Code:    "INVALID",
				Message: "volume_m3 must be greater than 0",
			})
		}
		if strings.TrimSpace(c.CargoType) == "" {
			verr.FieldErrors = append(verr.FieldErrors, FieldError{
				Field:   fieldPrefix + ".cargo_type",
				Code:    "REQUIRED",
				Message: "cargo_type is required",
			})
		}
		if c.DestinationWaypointTempID != nil && strings.TrimSpace(*c.DestinationWaypointTempID) != "" {
			if !tempIDSeen[strings.TrimSpace(*c.DestinationWaypointTempID)] {
				verr.FieldErrors = append(verr.FieldErrors, FieldError{
					Field:   fieldPrefix + ".destination_waypoint_temp_id",
					Code:    "WAYPOINT_REFERENCE_NOT_FOUND",
					Message: "destination waypoint temp_id does not exist in route.waypoints",
				})
			}
		}
	}

	if req.Trip.VehicleID <= 0 {
		verr.FieldErrors = append(verr.FieldErrors, FieldError{
			Field:   "trip.vehicle_id",
			Code:    "REQUIRED",
			Message: "trip.vehicle_id must be greater than 0",
		})
	}
	if req.Trip.DriverID <= 0 {
		verr.FieldErrors = append(verr.FieldErrors, FieldError{
			Field:   "trip.driver_id",
			Code:    "REQUIRED",
			Message: "trip.driver_id must be greater than 0",
		})
	}
	if strings.TrimSpace(req.Trip.StartTime) == "" {
		verr.FieldErrors = append(verr.FieldErrors, FieldError{
			Field:   "trip.start_time",
			Code:    "REQUIRED",
			Message: "trip.start_time is required",
		})
	}

	if !verr.hasErrors() {
		return nil
	}
	return verr
}
