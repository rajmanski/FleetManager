package assignments

import (
	"errors"
	"net/http"
	"strconv"

	"fleet-management/internal/httputil"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListAssignments(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 32)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "50"), 10, 32)
	activeOnly := c.DefaultQuery("active", "false") == "true"

	response, err := h.service.ListAssignments(c.Request.Context(), ListAssignmentsQuery{
		ActiveOnly: activeOnly,
		Page:       int32(page),
		Limit:      int32(limit),
	})
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid query params")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *Handler) CreateAssignment(c *gin.Context) {
	var req CreateAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	assignment, err := h.service.CreateAssignment(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrAssignedFromPast):
			httputil.RespondError(c, http.StatusBadRequest, err, "assigned_from cannot be more than 30 days in the past")
			return
		case errors.Is(err, ErrVehicleNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "vehicle not found")
			return
		case errors.Is(err, ErrDriverNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "driver not found")
			return
		case errors.Is(err, ErrDriverOverlap):
			httputil.RespondError(c, http.StatusConflict, err, "driver already has overlapping assignment")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusCreated, assignment)
}

func (h *Handler) EndAssignment(c *gin.Context) {
	assignmentID, err := parseAssignmentIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid assignment id")
		return
	}

	assignment, err := h.service.EndAssignment(c.Request.Context(), assignmentID)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrAssignmentNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "assignment not found")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, assignment)
}

func (h *Handler) GetVehicleAssignmentHistory(c *gin.Context) {
	vehicleID, err := httputil.ParsePositiveInt64Param(c, "id")
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid vehicle id")
		return
	}

	history, err := h.service.GetVehicleAssignmentHistory(c.Request.Context(), vehicleID)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, history)
}

func (h *Handler) GetDriverAssignmentHistory(c *gin.Context) {
	driverID, err := httputil.ParsePositiveInt64Param(c, "id")
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid driver id")
		return
	}

	history, err := h.service.GetDriverAssignmentHistory(c.Request.Context(), driverID)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, history)
}

func parseAssignmentIDParam(c *gin.Context) (int64, error) {
	return httputil.ParsePositiveInt64Param(c, "id")
}
