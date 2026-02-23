package drivers

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

func (h *Handler) ListDrivers(c *gin.Context) {
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

	response, err := h.service.ListDrivers(c.Request.Context(), ListDriversQuery{
		Status:         status,
		Search:         search,
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

func (h *Handler) GetDriver(c *gin.Context) {
	driverID, err := parseDriverIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid driver id"})
		return
	}

	driver, err := h.service.GetDriverByID(c.Request.Context(), driverID)
	if err != nil {
		if errors.Is(err, ErrDriverNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "driver not found"})
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, driver)
}

func (h *Handler) CreateDriver(c *gin.Context) {
	var req CreateDriverRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	driver, err := h.service.CreateDriver(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidPESEL), errors.Is(err, ErrInvalidStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		case errors.Is(err, ErrDriverPESELConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "pesel already exists"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
	}

	c.JSON(http.StatusCreated, driver)
}

func (h *Handler) UpdateDriver(c *gin.Context) {
	driverID, err := parseDriverIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid driver id"})
		return
	}

	var req UpdateDriverRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	driver, err := h.service.UpdateDriver(c.Request.Context(), driverID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidPESEL), errors.Is(err, ErrInvalidStatus), errors.Is(err, ErrInvalidCertificates):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		case errors.Is(err, ErrDriverNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "driver not found"})
			return
		case errors.Is(err, ErrDriverPESELConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "pesel already exists"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, driver)
}

func (h *Handler) DeleteDriver(c *gin.Context) {
	driverID, err := parseDriverIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid driver id"})
		return
	}

	err = h.service.DeleteDriver(c.Request.Context(), driverID)
	if err != nil {
		if errors.Is(err, ErrDriverHasActiveTrips) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete driver with active trips"})
			return
		}
		if errors.Is(err, ErrDriverNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "driver not found"})
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

func (h *Handler) RestoreDriver(c *gin.Context) {
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

	driverID, err := parseDriverIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid driver id"})
		return
	}

	driver, err := h.service.RestoreDriver(c.Request.Context(), driverID)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		case errors.Is(err, ErrDriverNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "driver not found"})
			return
		case errors.Is(err, ErrDriverRestoreConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "pesel conflicts with another active driver"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, driver)
}

func (h *Handler) GetDriverAvailability(c *gin.Context) {
	driverID, err := parseDriverIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid driver id"})
		return
	}

	date := c.Query("date")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date query parameter is required (YYYY-MM-DD)"})
		return
	}

	resp, err := h.service.GetDriverAvailability(c.Request.Context(), driverID, date)
	if err != nil {
		if errors.Is(err, ErrDriverNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "driver not found"})
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format (expected YYYY-MM-DD)"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) CanDriverTransportHazardous(c *gin.Context) {
	driverID, err := parseDriverIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid driver id"})
		return
	}

	orderIDStr := c.Query("order_id")
	if orderIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_id query parameter is required"})
		return
	}
	orderID, err := strconv.ParseInt(orderIDStr, 10, 64)
	if err != nil || orderID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order_id"})
		return
	}

	resp, err := h.service.CanDriverTransportHazardousCargo(c.Request.Context(), driverID, orderID)
	if err != nil {
		if errors.Is(err, ErrDriverNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "driver not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func parseDriverIDParam(c *gin.Context) (int64, error) {
	value := c.Param("id")
	driverID, err := strconv.ParseInt(value, 10, 64)
	if err != nil || driverID <= 0 {
		return 0, ErrInvalidInput
	}
	return driverID, nil
}
