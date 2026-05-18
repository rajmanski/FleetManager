package drivers

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
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid query params")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *Handler) GetDriver(c *gin.Context) {
	driverID, err := parseDriverIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid driver id")
		return
	}

	driver, err := h.service.GetDriverByID(c.Request.Context(), driverID)
	if err != nil {
		if errors.Is(err, ErrDriverNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "driver not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, driver)
}

func (h *Handler) CreateDriver(c *gin.Context) {
	var req CreateDriverRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	driver, err := h.service.CreateDriver(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidPESEL), errors.Is(err, ErrInvalidStatus):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrDriverPESELConflict):
			httputil.RespondError(c, http.StatusConflict, err, "pesel already exists")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusCreated, driver)
}

func (h *Handler) UpdateDriver(c *gin.Context) {
	driverID, err := parseDriverIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid driver id")
		return
	}

	var req UpdateDriverRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	driver, err := h.service.UpdateDriver(c.Request.Context(), driverID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidPESEL), errors.Is(err, ErrInvalidStatus), errors.Is(err, ErrInvalidCertificates):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrDriverNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "driver not found")
			return
		case errors.Is(err, ErrDriverPESELConflict):
			httputil.RespondError(c, http.StatusConflict, err, "pesel already exists")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, driver)
}

func (h *Handler) DeleteDriver(c *gin.Context) {
	driverID, err := parseDriverIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid driver id")
		return
	}

	err = h.service.DeleteDriver(c.Request.Context(), driverID)
	if err != nil {
		if errors.Is(err, ErrDriverHasActiveTrips) {
			httputil.RespondError(c, http.StatusForbidden, err, "Cannot delete driver with active trips")
			return
		}
		if errors.Is(err, ErrDriverNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "driver not found")
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
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid driver id")
		return
	}

	driver, err := h.service.RestoreDriver(c.Request.Context(), driverID)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrDriverNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "driver not found")
			return
		case errors.Is(err, ErrDriverRestoreConflict):
			httputil.RespondError(c, http.StatusConflict, err, "pesel conflicts with another active driver")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, driver)
}

func (h *Handler) GetDriverAvailability(c *gin.Context) {
	driverID, err := parseDriverIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid driver id")
		return
	}

	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")
	date := c.Query("date")

	switch {
	case dateFrom != "" || dateTo != "":
		if dateFrom == "" || dateTo == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "date_from and date_to are required together (YYYY-MM-DD)"})
			return
		}
		resp, err := h.service.GetDriverAvailabilityInRange(c.Request.Context(), driverID, dateFrom, dateTo)
		if err != nil {
			if errors.Is(err, ErrDriverNotFound) {
				httputil.RespondError(c, http.StatusNotFound, err, "driver not found")
				return
			}
			if errors.Is(err, ErrInvalidInput) {
				httputil.RespondError(c, http.StatusBadRequest, err, "invalid date range (expected YYYY-MM-DD)")
				return
			}
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}

		c.JSON(http.StatusOK, resp)
		return

	case date != "":
		resp, err := h.service.GetDriverAvailabilityByDate(c.Request.Context(), driverID, date)
		if err != nil {
			if errors.Is(err, ErrDriverNotFound) {
				httputil.RespondError(c, http.StatusNotFound, err, "driver not found")
				return
			}
			if errors.Is(err, ErrInvalidInput) {
				httputil.RespondError(c, http.StatusBadRequest, err, "invalid date format (expected YYYY-MM-DD)")
				return
			}
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}

		c.JSON(http.StatusOK, resp)
		return

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "either date or date_from/date_to query parameters are required"})
		return
	}
}

func (h *Handler) CanDriverTransportHazardous(c *gin.Context) {
	driverID, err := parseDriverIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid driver id")
		return
	}

	orderIDStr := c.Query("order_id")
	if orderIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_id query parameter is required"})
		return
	}
	orderID, err := strconv.ParseInt(orderIDStr, 10, 64)
	if err != nil || orderID <= 0 {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid order_id")
		return
	}

	resp, err := h.service.CanDriverTransportHazardousCargo(c.Request.Context(), driverID, orderID)
	if err != nil {
		if errors.Is(err, ErrDriverNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "driver not found")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, resp)
}

func parseDriverIDParam(c *gin.Context) (int64, error) {
	return httputil.ParsePositiveInt64Param(c, "id")
}
