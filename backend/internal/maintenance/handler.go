package maintenance

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

func (h *Handler) ListMaintenance(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 32)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "50"), 10, 32)
	vehicleIDStr := c.Query("vehicle_id")
	status := c.Query("status")

	var vehicleID int64
	if vehicleIDStr != "" {
		id, err := strconv.ParseInt(vehicleIDStr, 10, 64)
		if err != nil || id <= 0 {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid vehicle_id")
			return
		}
		vehicleID = id
	}

	resp, err := h.service.ListMaintenance(c.Request.Context(), ListMaintenanceQuery{
		VehicleID: vehicleID,
		Status:    status,
		Page:      int32(page),
		Limit:     int32(limit),
	})
	if err != nil {
		if errors.Is(err, ErrInvalidInput) || errors.Is(err, ErrInvalidStatus) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid query params")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) GetMaintenance(c *gin.Context) {
	maintenanceID, err := parseMaintenanceIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid maintenance id")
		return
	}

	m, err := h.service.GetMaintenanceByID(c.Request.Context(), maintenanceID)
	if err != nil {
		if errors.Is(err, ErrMaintenanceNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "maintenance not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, m)
}

func (h *Handler) CreateMaintenance(c *gin.Context) {
	var req CreateMaintenanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	m, err := h.service.CreateMaintenance(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidType), errors.Is(err, ErrInvalidStatus):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusCreated, m)
}

func (h *Handler) UpdateMaintenance(c *gin.Context) {
	maintenanceID, err := parseMaintenanceIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid maintenance id")
		return
	}

	var req UpdateMaintenanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	m, err := h.service.UpdateMaintenance(c.Request.Context(), maintenanceID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidType), errors.Is(err, ErrInvalidStatus):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrMaintenanceNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "maintenance not found")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, m)
}

func (h *Handler) UpdateMaintenanceStatus(c *gin.Context) {
	maintenanceID, err := parseMaintenanceIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid maintenance id")
		return
	}

	var req UpdateMaintenanceStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	m, err := h.service.UpdateMaintenanceStatus(c.Request.Context(), maintenanceID, req.Status)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidStatus):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrMaintenanceNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "maintenance not found")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, m)
}

func parseMaintenanceIDParam(c *gin.Context) (int64, error) {
	return httputil.ParsePositiveInt64Param(c, "id")
}
