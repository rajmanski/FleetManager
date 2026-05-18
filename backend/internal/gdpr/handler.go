package gdpr

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

func (h *Handler) ForgetDriver(c *gin.Context) {
	idStr := c.Param("id")
	driverID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || driverID <= 0 {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid driver id")
		return
	}

	if err := h.service.ForgetDriver(c.Request.Context(), driverID); err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
		case errors.Is(err, ErrDriverNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "driver not found")
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
