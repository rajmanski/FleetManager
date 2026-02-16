package vehicles

import (
	"errors"
	"net/http"
	"strconv"

	"fleet-management/internal/auth"

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
		IncludeDeleted: includeDeleted,
		Page:           int32(page),
		Limit:          int32(limit),
	})
	if err != nil {
		if errors.Is(err, ErrInvalidInput) || errors.Is(err, ErrInvalidStatus) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query params"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *Handler) GetVehicle(c *gin.Context) {
	vehicleID, err := parseVehicleIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle id"})
		return
	}

	vehicle, err := h.service.GetVehicleByID(c.Request.Context(), vehicleID)
	if err != nil {
		if errors.Is(err, ErrVehicleNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found"})
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, vehicle)
}

func (h *Handler) CreateVehicle(c *gin.Context) {
	var req CreateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	vehicle, err := h.service.CreateVehicle(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidVIN), errors.Is(err, ErrInvalidStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		case errors.Is(err, ErrVehicleVINConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "vin already exists"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
	}

	c.JSON(http.StatusCreated, vehicle)
}

func (h *Handler) UpdateVehicle(c *gin.Context) {
	vehicleID, err := parseVehicleIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle id"})
		return
	}

	var req UpdateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	vehicle, err := h.service.UpdateVehicle(c.Request.Context(), vehicleID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidVIN), errors.Is(err, ErrInvalidStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		case errors.Is(err, ErrVehicleNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found"})
			return
		case errors.Is(err, ErrVehicleVINConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "vin already exists"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, vehicle)
}

func (h *Handler) DeleteVehicle(c *gin.Context) {
	vehicleID, err := parseVehicleIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle id"})
		return
	}

	err = h.service.DeleteVehicle(c.Request.Context(), vehicleID)
	if err != nil {
		if errors.Is(err, ErrVehicleHasActiveTrips) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete vehicle with active trips"})
			return
		}
		if errors.Is(err, ErrVehicleNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found"})
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) UpdateVehicleStatus(c *gin.Context) {
	vehicleID, err := parseVehicleIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle id"})
		return
	}

	var req UpdateVehicleStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	vehicle, err := h.service.UpdateVehicleStatus(c.Request.Context(), vehicleID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		case errors.Is(err, ErrVehicleNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle id"})
		return
	}

	vehicle, err := h.service.RestoreVehicle(c.Request.Context(), vehicleID)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		case errors.Is(err, ErrVehicleRestoreConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "vin conflicts with another active vehicle"})
			return
		case errors.Is(err, ErrVehicleNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, vehicle)
}

func parseVehicleIDParam(c *gin.Context) (int64, error) {
	value := c.Param("id")
	vehicleID, err := strconv.ParseInt(value, 10, 64)
	if err != nil || vehicleID <= 0 {
		return 0, ErrInvalidInput
	}
	return vehicleID, nil
}
