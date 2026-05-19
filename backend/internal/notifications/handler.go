package notifications

import (
	"errors"
	"math"
	"net/http"
	"strconv"

	"fleet-management/internal/auth"
	"fleet-management/internal/httputil"

	"github.com/gin-gonic/gin"
)

const defaultLookaheadDays = 30

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListNotifications(c *gin.Context) {
	userID, ok := currentUserID32(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	items, err := h.service.ListForUser(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrInvalidUserID) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid user")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, items)
}

func (h *Handler) MarkNotificationRead(c *gin.Context) {
	userID, ok := currentUserID32(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idStr := c.Param("id")
	nid64, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || nid64 <= 0 || nid64 > math.MaxInt32 {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid notification id")
		return
	}

	err = h.service.MarkAsReadForUser(c.Request.Context(), userID, int32(nid64))
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidUserID):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrNotificationNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "notification not found")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) RunScheduler(c *gin.Context) {
	lookaheadDays := int64(defaultLookaheadDays)
	if v := c.Query("lookahead_days"); v != "" {
		if parsed, err := strconv.ParseInt(v, 10, 64); err == nil && parsed > 0 {
			lookaheadDays = parsed
		}
	}

	if err := h.service.RunDueTermNotifications(c.Request.Context(), lookaheadDays); err != nil {
		httputil.RespondError(c, http.StatusInternalServerError, err, "scheduler run failed")
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func currentUserID32(c *gin.Context) (int32, bool) {
	v, exists := c.Get(auth.ContextUserIDKey)
	if !exists {
		return 0, false
	}
	id64, ok := v.(int64)
	if !ok || id64 <= 0 || id64 > math.MaxInt32 {
		return 0, false
	}
	return int32(id64), true
}
