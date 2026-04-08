package changelog

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListAdminChangelog(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 32)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "50"), 10, 32)

	q := ListChangelogQuery{
		Page:      int32(page),
		Limit:     int32(limit),
		TableName: strings.TrimSpace(c.Query("table_name")),
		Operation: strings.TrimSpace(c.Query("operation")),
	}

	if uidStr := strings.TrimSpace(c.Query("user_id")); uidStr != "" {
		uid, err := strconv.ParseInt(uidStr, 10, 64)
		if err != nil || uid <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
			return
		}
		q.UserID = uid
	}

	if df := strings.TrimSpace(c.Query("date_from")); df != "" {
		t, err := parseChangelogDateParam(df, false)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date_from"})
			return
		}
		q.DateFrom = &t
	}
	if dt := strings.TrimSpace(c.Query("date_to")); dt != "" {
		t, err := parseChangelogDateParam(dt, true)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date_to"})
			return
		}
		q.DateTo = &t
	}

	resp, err := h.service.List(c.Request.Context(), q)
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

func parseChangelogDateParam(s string, endOfDay bool) (time.Time, error) {
	s = strings.TrimSpace(s)
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}
	t, err := time.ParseInLocation("2006-01-02", s, time.Local)
	if err != nil {
		return time.Time{}, err
	}
	if endOfDay {
		return time.Date(t.Year(), t.Month(), t.Day(), 23, 59, 59, 999_999_999, t.Location()), nil
	}
	return t, nil
}
