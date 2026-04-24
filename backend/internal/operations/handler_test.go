package operations

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

type handlerStoreStub struct {
	response PlanOrderWorkflowResponse
	err      error
}

func (s *handlerStoreStub) ExecutePlannedOrderWorkflowTx(
	_ context.Context,
	_ PlanOrderWorkflowRequest,
) (PlanOrderWorkflowResponse, error) {
	return s.response, s.err
}

func TestCreatePlannedOrderWorkflowHandler_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := &handlerStoreStub{
		response: PlanOrderWorkflowResponse{
			Status: "planned",
			Order:  PlannedOrderSummary{ID: 101, OrderNumber: "ORD-2026-001", Status: "Planned"},
		},
	}
	router := testRouter(store)

	body, _ := json.Marshal(validWorkflowRequest())
	req := httptest.NewRequest(http.MethodPost, "/api/v1/operations/orders/plan", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d, body=%s", rec.Code, rec.Body.String())
	}
}

func TestCreatePlannedOrderWorkflowHandler_ValidationError422(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := &handlerStoreStub{
		err: &ValidationError{
			Message: "workflow validation failed",
			FieldErrors: []FieldError{
				{Field: "trip.driver_id", Code: "ADR_REQUIRED", Message: "selected driver cannot transport hazardous cargo"},
			},
		},
	}
	router := testRouter(store)

	body, _ := json.Marshal(validWorkflowRequest())
	req := httptest.NewRequest(http.MethodPost, "/api/v1/operations/orders/plan", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d, body=%s", rec.Code, rec.Body.String())
	}
}

func TestCreatePlannedOrderWorkflowHandler_Conflict409(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := &handlerStoreStub{
		err: &ValidationError{
			Message: "workflow validation failed",
			FieldErrors: []FieldError{
				{Field: "trip.vehicle_id", Code: "VEHICLE_CONFLICT", Message: "vehicle already has scheduled or active trip in selected time range"},
			},
		},
	}
	router := testRouter(store)

	body, _ := json.Marshal(validWorkflowRequest())
	req := httptest.NewRequest(http.MethodPost, "/api/v1/operations/orders/plan", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d, body=%s", rec.Code, rec.Body.String())
	}
}

func TestCreatePlannedOrderWorkflowHandler_InvalidBody400(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := testRouter(&handlerStoreStub{})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/operations/orders/plan", bytes.NewBufferString(`{`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d, body=%s", rec.Code, rec.Body.String())
	}
}

func testRouter(store WorkflowStore) *gin.Engine {
	service := NewService(store)
	handler := NewHandler(service)
	router := gin.New()
	router.POST("/api/v1/operations/orders/plan", handler.CreatePlannedOrderWorkflow)
	return router
}
