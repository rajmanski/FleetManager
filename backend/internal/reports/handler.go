package reports

import (
	"errors"
	"fmt"
	"net/http"

	"fleet-management/internal/httputil"

	"github.com/gin-gonic/gin"
)

const xlsxContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetVehicleProfitability(c *gin.Context) {
	vehicleID, ok := httputil.ParsePositiveInt64Query(c, "vehicle_id")
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle_id"})
		return
	}

	month := c.Query("month")
	resp, err := h.service.GetVehicleProfitability(c.Request.Context(), VehicleProfitabilityQuery{
		VehicleID: vehicleID,
		Month:     month,
	})
	if !handleServiceError(c, err) {
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) ExportVehicleProfitability(c *gin.Context) {
	vehicleID, ok := httputil.ParsePositiveInt64Query(c, "vehicle_id")
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid vehicle_id"})
		return
	}

	month := c.Query("month")
	data, filename, err := h.service.ExportVehicleProfitabilityXLSX(c.Request.Context(), VehicleProfitabilityQuery{
		VehicleID: vehicleID,
		Month:     month,
	})
	if !handleServiceError(c, err) {
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Data(http.StatusOK, xlsxContentType, data)
}

func (h *Handler) GetDriverMileage(c *gin.Context) {
	driverID, ok := httputil.ParsePositiveInt64Query(c, "driver_id")
	if !ok {
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
	if !handleServiceError(c, err) {
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
	if !handleServiceError(c, err) {
		return
	}

	c.JSON(http.StatusOK, resp)
}



func handleServiceError(c *gin.Context, err error) bool {
	if err == nil {
		return true
	}
	if errors.Is(err, ErrInvalidInput) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query params"})
		return false
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
	return false
}
