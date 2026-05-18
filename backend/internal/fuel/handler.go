package fuel

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

func (h *Handler) CreateFuelLog(c *gin.Context) {
	var req CreateFuelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	resp, err := h.service.CreateFuelLog(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
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

	c.JSON(http.StatusCreated, resp)
}

func (h *Handler) ListFuelLogs(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 32)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "50"), 10, 32)
	vehicleIDStr := c.Query("vehicle_id")
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	var vehicleID int64
	if vehicleIDStr != "" {
		id, err := strconv.ParseInt(vehicleIDStr, 10, 64)
		if err != nil || id <= 0 {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid vehicle_id")
			return
		}
		vehicleID = id
	}

	resp, err := h.service.ListFuelLogs(c.Request.Context(), ListFuelLogsQuery{
		VehicleID: vehicleID,
		DateFrom:  dateFrom,
		DateTo:    dateTo,
		Page:      int32(page),
		Limit:     int32(limit),
	})
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid query params")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, resp)
}
