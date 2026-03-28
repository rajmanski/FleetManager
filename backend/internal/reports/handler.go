package reports

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetVehicleProfitability(c *gin.Context) {
	vehicleID, err := strconv.ParseInt(c.Query("vehicle_id"), 10, 64)
	if err != nil || vehicleID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle_id"})
		return
	}

	month := c.Query("month")
	resp, err := h.service.GetVehicleProfitability(c.Request.Context(), VehicleProfitabilityQuery{
		VehicleID: vehicleID,
		Month:     month,
	})
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query params"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) GetDriverMileage(c *gin.Context) {
	driverID, err := strconv.ParseInt(c.Query("driver_id"), 10, 64)
	if err != nil || driverID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid driver_id"})
		return
	}

	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")
	resp, err := h.service.GetDriverMileage(c.Request.Context(), DriverMileageQuery{
		DriverID: driverID,
		DateFrom: dateFrom,
		DateTo:   dateTo,
	})
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query params"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) GetGlobalCosts(c *gin.Context) {
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")
	resp, err := h.service.GetGlobalCosts(c.Request.Context(), GlobalCostsQuery{
		DateFrom: dateFrom,
		DateTo:   dateTo,
	})
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query params"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, resp)
}
