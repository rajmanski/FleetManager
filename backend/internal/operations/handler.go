package operations

import (
	"errors"
	"net/http"

	"fleet-management/internal/httputil"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) CreatePlannedOrderWorkflow(c *gin.Context) {
	var req PlanOrderWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	resp, err := h.service.CreatePlannedOrderWorkflow(c.Request.Context(), req)
	if err != nil {
		var verr *ValidationError
		if errors.As(err, &verr) {
			status := http.StatusUnprocessableEntity
			if verr.HasCode("VEHICLE_CONFLICT") || verr.HasCode("DRIVER_CONFLICT") {
				status = http.StatusConflict
			}
			c.JSON(status, gin.H{
				"error": gin.H{
					"code":          "VALIDATION_FAILED",
					"message":       verr.Error(),
					"field_errors":  verr.FieldErrors,
					"global_errors": verr.GlobalErrors,
				},
			})
			return
		}

		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusCreated, resp)
}
