package cargo

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

func (h *Handler) ListCargo(c *gin.Context) {
	orderID, err := parseOrderIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid order id")
		return
	}
	items, err := h.service.ListCargo(c.Request.Context(), orderID)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h *Handler) GetCargo(c *gin.Context) {
	cargoID, err := parseCargoIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid cargo id")
		return
	}
	cargo, err := h.service.GetCargoByID(c.Request.Context(), cargoID)
	if err != nil {
		if errors.Is(err, ErrCargoNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "cargo not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}
	c.JSON(http.StatusOK, cargo)
}

func (h *Handler) CreateCargo(c *gin.Context) {
	orderID, err := parseOrderIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid order id")
		return
	}
	var req CreateCargoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}
	cargo, err := h.service.CreateCargo(c.Request.Context(), orderID, req)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}
	c.JSON(http.StatusCreated, cargo)
}

func (h *Handler) UpdateCargo(c *gin.Context) {
	cargoID, err := parseCargoIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid cargo id")
		return
	}
	var req UpdateCargoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}
	cargo, err := h.service.UpdateCargo(c.Request.Context(), cargoID, req)
	if err != nil {
		if errors.Is(err, ErrCargoNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "cargo not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		if errors.Is(err, ErrOrderInProgress) {
			httputil.RespondError(c, http.StatusForbidden, err, "cannot modify cargo when order is in progress")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}
	c.JSON(http.StatusOK, cargo)
}

func (h *Handler) DeleteCargo(c *gin.Context) {
	cargoID, err := parseCargoIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid cargo id")
		return
	}
	err = h.service.DeleteCargo(c.Request.Context(), cargoID)
	if err != nil {
		if errors.Is(err, ErrCargoNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "cargo not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		if errors.Is(err, ErrOrderInProgress) {
			httputil.RespondError(c, http.StatusForbidden, err, "cannot delete cargo when order is in progress")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) AssignWaypoint(c *gin.Context) {
	cargoID, err := parseCargoIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid cargo id")
		return
	}
	var req AssignWaypointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}
	cargo, err := h.service.AssignWaypoint(c.Request.Context(), cargoID, req)
	if err != nil {
		if errors.Is(err, ErrCargoNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "cargo not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		if errors.Is(err, ErrWaypointNotInOrderRoute) {
			httputil.RespondError(c, http.StatusBadRequest, err, "waypoint does not belong to this order's route")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}
	c.JSON(http.StatusOK, cargo)
}

func parseOrderIDParam(c *gin.Context) (int64, error) {
	return httputil.ParsePositiveInt64Param(c, "id")
}

func parseCargoIDParam(c *gin.Context) (int64, error) {
	return httputil.ParsePositiveInt64Param(c, "id")
}
