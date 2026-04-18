package operations

import (
	"context"
	"fmt"
	"log"
	"strings"
)

type WorkflowStore interface {
	ExecutePlannedOrderWorkflowTx(ctx context.Context, req PlanOrderWorkflowRequest) (PlanOrderWorkflowResponse, error)
}

type Service struct {
	workflowStore WorkflowStore
}

var allowedCargoTypes = map[string]bool{
	"General":      true,
	"Refrigerated": true,
	"Hazardous":    true,
}

var allowedWaypointActions = map[string]bool{
	"Pickup":   true,
	"Dropoff":  true,
	"Stopover": true,
}

func NewService(workflowStore WorkflowStore) *Service {
	return &Service{
		workflowStore: workflowStore,
	}
}

func (s *Service) CreatePlannedOrderWorkflow(
	ctx context.Context,
	req PlanOrderWorkflowRequest,
) (PlanOrderWorkflowResponse, error) {
	if verr := validateWorkflowRequest(req); verr != nil {
		return PlanOrderWorkflowResponse{}, verr
	}

	response, err := s.workflowStore.ExecutePlannedOrderWorkflowTx(ctx, req)
	if err != nil {
		// Keep rollback reason explicit for monitoring/debug.
		log.Printf("operations workflow rollback: %v", err)
		return PlanOrderWorkflowResponse{}, err
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
		actionType := strings.TrimSpace(wp.ActionType)
		if actionType == "" || !allowedWaypointActions[actionType] {
			verr.FieldErrors = append(verr.FieldErrors, FieldError{
				Field:   fieldPrefix + ".action_type",
				Code:    "INVALID",
				Message: "action_type must be one of: Pickup, Dropoff, Stopover",
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
		if strings.TrimSpace(c.CargoType) != "" && !allowedCargoTypes[strings.TrimSpace(c.CargoType)] {
			verr.FieldErrors = append(verr.FieldErrors, FieldError{
				Field:   fieldPrefix + ".cargo_type",
				Code:    "INVALID",
				Message: "cargo_type must be one of: General, Refrigerated, Hazardous",
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
