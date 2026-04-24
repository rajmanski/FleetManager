package operations

import (
	"context"
	"testing"
)

type workflowStoreStub struct {
	called       bool
	gotReq       PlanOrderWorkflowRequest
	response     PlanOrderWorkflowResponse
	err          error
}

func (s *workflowStoreStub) ExecutePlannedOrderWorkflowTx(
	_ context.Context,
	req PlanOrderWorkflowRequest,
) (PlanOrderWorkflowResponse, error) {
	s.called = true
	s.gotReq = req
	return s.response, s.err
}

func TestCreatePlannedOrderWorkflow_Success(t *testing.T) {
	req := validWorkflowRequest()
	expected := PlanOrderWorkflowResponse{
		Status: "planned",
		Order: PlannedOrderSummary{
			ID:          1,
			OrderNumber: "ORD-2026-001",
			Status:      "Planned",
		},
	}
	store := &workflowStoreStub{response: expected}
	service := NewService(store)

	got, err := service.CreatePlannedOrderWorkflow(context.Background(), req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !store.called {
		t.Fatalf("expected workflow store to be called")
	}
	if got.Status != expected.Status || got.Order.OrderNumber != expected.Order.OrderNumber {
		t.Fatalf("unexpected response: %#v", got)
	}
}

func TestCreatePlannedOrderWorkflow_ValidationStopsBeforeStore(t *testing.T) {
	req := validWorkflowRequest()
	req.Order.ClientID = 0
	store := &workflowStoreStub{}
	service := NewService(store)

	_, err := service.CreatePlannedOrderWorkflow(context.Background(), req)
	if err == nil {
		t.Fatalf("expected validation error")
	}
	if store.called {
		t.Fatalf("store should not be called on validation failure")
	}
	verr, ok := err.(*ValidationError)
	if !ok {
		t.Fatalf("expected ValidationError, got %T", err)
	}
	if !verr.HasCode("REQUIRED") {
		t.Fatalf("expected REQUIRED code in validation errors")
	}
}

func TestCreatePlannedOrderWorkflow_RollbackErrorsArePropagated(t *testing.T) {
	req := validWorkflowRequest()
	store := &workflowStoreStub{
		err: &ValidationError{
			Message: "workflow validation failed",
			FieldErrors: []FieldError{
				{Field: "trip.driver_id", Code: "ADR_REQUIRED", Message: "selected driver cannot transport hazardous cargo"},
			},
		},
	}
	service := NewService(store)

	_, err := service.CreatePlannedOrderWorkflow(context.Background(), req)
	if err == nil {
		t.Fatalf("expected error")
	}
	verr, ok := err.(*ValidationError)
	if !ok {
		t.Fatalf("expected ValidationError, got %T", err)
	}
	if !verr.HasCode("ADR_REQUIRED") {
		t.Fatalf("expected ADR_REQUIRED code")
	}
}

func TestValidateWorkflowRequest_WaypointSequenceMustBeContinuous(t *testing.T) {
	req := validWorkflowRequest()
	req.Route.Waypoints = []PlanWaypoint{
		{
			TempID:        "wp-1",
			SequenceOrder: 1,
			Address:       "A",
			Latitude:      52.2297,
			Longitude:     21.0122,
			ActionType:    "Pickup",
		},
		{
			TempID:        "wp-3",
			SequenceOrder: 3,
			Address:       "B",
			Latitude:      50.0647,
			Longitude:     19.9450,
			ActionType:    "Dropoff",
		},
	}

	verr := validateWorkflowRequest(req)
	if verr == nil {
		t.Fatalf("expected validation error")
	}
	if !verr.HasCode("SEQUENCE_INVALID") {
		t.Fatalf("expected SEQUENCE_INVALID code, got %#v", verr.GlobalErrors)
	}
}

func TestValidateWorkflowRequest_CargoWaypointReferenceMustExist(t *testing.T) {
	req := validWorkflowRequest()
	badRef := "unknown-waypoint"
	req.Cargo[0].DestinationWaypointTempID = &badRef

	verr := validateWorkflowRequest(req)
	if verr == nil {
		t.Fatalf("expected validation error")
	}
	if !verr.HasCode("WAYPOINT_REFERENCE_NOT_FOUND") {
		t.Fatalf("expected WAYPOINT_REFERENCE_NOT_FOUND code")
	}
}

func validWorkflowRequest() PlanOrderWorkflowRequest {
	deadline := "2026-12-31"
	price := 12000.0
	distance := 350.5
	eta := int32(240)
	wpRef := "wp-2"

	return PlanOrderWorkflowRequest{
		Order: PlanOrderInput{
			ClientID:         1,
			OrderNumber:      "ORD-2026-001",
			DeliveryDeadline: &deadline,
			TotalPricePln:    &price,
		},
		Cargo: []PlanCargo{
			{
				Description:               "Pallets",
				WeightKg:                  1200,
				VolumeM3:                  10,
				CargoType:                 "General",
				DestinationWaypointTempID: &wpRef,
			},
		},
		Route: PlanRouteInput{
			StartLocation:     "Warszawa",
			EndLocation:       "Krakow",
			PlannedDistanceKm: &distance,
			EstimatedTimeMin:  &eta,
			Waypoints: []PlanWaypoint{
				{
					TempID:        "wp-1",
					SequenceOrder: 1,
					Address:       "Warszawa",
					Latitude:      52.2297,
					Longitude:     21.0122,
					ActionType:    "Pickup",
				},
				{
					TempID:        "wp-2",
					SequenceOrder: 2,
					Address:       "Lodz",
					Latitude:      51.7592,
					Longitude:     19.4560,
					ActionType:    "Dropoff",
				},
			},
		},
		Trip: PlanTripInput{
			VehicleID: 5,
			DriverID:  12,
			StartTime: "2026-06-01T10:00:00Z",
		},
	}
}
