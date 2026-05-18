package changelog

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"fleet-management/internal/httputil"

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
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid user_id")
			return
		}
		q.UserID = uid
	}
	if ridStr := strings.TrimSpace(c.Query("record_id")); ridStr != "" {
		rid, err := strconv.ParseInt(ridStr, 10, 64)
		if err != nil || rid <= 0 {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid record_id")
			return
		}
		q.RecordID = rid
	}

	if df := strings.TrimSpace(c.Query("date_from")); df != "" {
		t, err := parseChangelogDateParam(df, false)
		if err != nil {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid date_from")
			return
		}
		q.DateFrom = &t
	}
	if dt := strings.TrimSpace(c.Query("date_to")); dt != "" {
		t, err := parseChangelogDateParam(dt, true)
		if err != nil {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid date_to")
			return
		}
		q.DateTo = &t
	}

	resp, err := h.service.List(c.Request.Context(), q)
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
