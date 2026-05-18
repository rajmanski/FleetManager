package costs

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

func (h *Handler) ListCosts(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 32)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "50"), 10, 32)
	vehicleIDStr := c.Query("vehicle_id")
	category := c.Query("category")

	var vehicleID int64
	if vehicleIDStr != "" {
		id, err := strconv.ParseInt(vehicleIDStr, 10, 64)
		if err != nil || id <= 0 {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid vehicle_id")
			return
		}
		vehicleID = id
	}

	resp, err := h.service.ListCosts(c.Request.Context(), ListCostsQuery{
		VehicleID: vehicleID,
		Category:  category,
		Page:      int32(page),
		Limit:     int32(limit),
	})
	if err != nil {
		if errors.Is(err, ErrInvalidInput) || errors.Is(err, ErrInvalidCategory) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid query params")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) CreateCost(c *gin.Context) {
	var req CreateCostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	result, err := h.service.CreateCost(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidCategory):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusCreated, result)
}

func (h *Handler) UpdateCost(c *gin.Context) {
	id, err := parseCostIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid cost id")
		return
	}

	var req UpdateCostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	result, err := h.service.UpdateCost(c.Request.Context(), id, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidCategory):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrCostNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "cost not found")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) DeleteCost(c *gin.Context) {
	id, err := parseCostIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid cost id")
		return
	}

	if err := h.service.DeleteCost(c.Request.Context(), id); err != nil {
		if errors.Is(err, ErrCostNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "cost not found")
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

func parseCostIDParam(c *gin.Context) (int64, error) {
	return httputil.ParsePositiveInt64Param(c, "id")
}
