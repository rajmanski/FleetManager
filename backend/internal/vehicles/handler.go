package vehicles

import (
	"errors"
	"net/http"
	"strconv"

	"fleet-management/internal/auth"
	"fleet-management/internal/httputil"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListVehicles(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 32)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "50"), 10, 32)
	status := c.Query("status")
	search := c.Query("q")
	includeDeleted := c.DefaultQuery("include_deleted", "false") == "true"

	if includeDeleted {
		roleValue, exists := c.Get(auth.ContextRoleKey)
		role, roleOK := roleValue.(string)
		if !exists || !roleOK || role != "Administrator" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
	}

	response, err := h.service.ListVehicles(c.Request.Context(), ListVehiclesQuery{
		Status:         status,
		Search:         search,
		IncludeDeleted: includeDeleted,
		Page:           int32(page),
		Limit:          int32(limit),
	})
	if err != nil {
		if errors.Is(err, ErrInvalidInput) || errors.Is(err, ErrInvalidStatus) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid query params")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *Handler) GetVehicle(c *gin.Context) {
	vehicleID, err := parseVehicleIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid vehicle id")
		return
	}

	vehicle, err := h.service.GetVehicleByID(c.Request.Context(), vehicleID)
	if err != nil {
		if errors.Is(err, ErrVehicleNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "vehicle not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, vehicle)
}

func (h *Handler) CreateVehicle(c *gin.Context) {
	var req CreateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	vehicle, err := h.service.CreateVehicle(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidVIN), errors.Is(err, ErrInvalidStatus):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrVehicleVINConflict):
			httputil.RespondError(c, http.StatusConflict, err, "vin already exists")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusCreated, vehicle)
}

func (h *Handler) UpdateVehicle(c *gin.Context) {
	vehicleID, err := parseVehicleIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid vehicle id")
		return
	}

	var req UpdateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	vehicle, err := h.service.UpdateVehicle(c.Request.Context(), vehicleID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidVIN), errors.Is(err, ErrInvalidStatus):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrVehicleNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "vehicle not found")
			return
		case errors.Is(err, ErrVehicleVINConflict):
			httputil.RespondError(c, http.StatusConflict, err, "vin already exists")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, vehicle)
}

func (h *Handler) DeleteVehicle(c *gin.Context) {
	vehicleID, err := parseVehicleIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid vehicle id")
		return
	}

	err = h.service.DeleteVehicle(c.Request.Context(), vehicleID)
	if err != nil {
		if errors.Is(err, ErrVehicleHasActiveTrips) {
			httputil.RespondError(c, http.StatusForbidden, err, "Cannot delete vehicle with active trips")
			return
		}
		if errors.Is(err, ErrVehicleNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "vehicle not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) UpdateVehicleStatus(c *gin.Context) {
	vehicleID, err := parseVehicleIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid vehicle id")
		return
	}

	var req UpdateVehicleStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	vehicle, err := h.service.UpdateVehicleStatus(c.Request.Context(), vehicleID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidStatus):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrVehicleNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "vehicle not found")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, vehicle)
}

func (h *Handler) RestoreVehicle(c *gin.Context) {
	roleValue, exists := c.Get(auth.ContextRoleKey)
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	role, ok := roleValue.(string)
	if !ok || role != "Administrator" {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	vehicleID, err := parseVehicleIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid vehicle id")
		return
	}

	vehicle, err := h.service.RestoreVehicle(c.Request.Context(), vehicleID)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrVehicleRestoreConflict):
			httputil.RespondError(c, http.StatusConflict, err, "vin conflicts with another active vehicle")
			return
		case errors.Is(err, ErrVehicleNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "vehicle not found")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, vehicle)
}

func (h *Handler) GetVehicleAvailability(c *gin.Context) {
	vehicleID, err := parseVehicleIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid vehicle id")
		return
	}

	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")
	if dateFrom == "" || dateTo == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date_from and date_to are required (YYYY-MM-DD)"})
		return
	}

	resp, err := h.service.GetVehicleAvailability(c.Request.Context(), vehicleID, dateFrom, dateTo)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		if errors.Is(err, ErrVehicleNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "vehicle not found")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) GetVehicleMileageHistory(c *gin.Context) {
	vehicleID, err := parseVehicleIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid vehicle id")
		return
	}

	rows, err := h.service.GetVehicleMileageHistory(c.Request.Context(), vehicleID)
	if err != nil {
		if errors.Is(err, ErrVehicleNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "vehicle not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid query params")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, rows)
}

func (h *Handler) GetVehicleMaintenanceHistory(c *gin.Context) {
	vehicleID, err := parseVehicleIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid vehicle id")
		return
	}

	typeFilter := c.Query("type")
	statusFilter := c.Query("status")

	rows, err := h.service.GetVehicleMaintenanceHistory(c.Request.Context(), vehicleID, typeFilter, statusFilter)
	if err != nil {
		if errors.Is(err, ErrVehicleNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "vehicle not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid query params")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, rows)
}

func parseVehicleIDParam(c *gin.Context) (int64, error) {
	return httputil.ParsePositiveInt64Param(c, "id")
}
