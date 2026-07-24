package dictionaries

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"fleet-management/internal/httputil"

	"github.com/gin-gonic/gin"
)

type enumColumnInfo struct {
	table  string
	column string
	extra  string
}

var categoryEnumMapping = map[string]enumColumnInfo{
	"cargo_types":       {table: "Cargo", column: "cargo_type", extra: "NOT NULL DEFAULT 'General'"},
	"vehicle_statuses":  {table: "Vehicles", column: "status", extra: "NOT NULL DEFAULT 'Available'"},
	"maintenance_types": {table: "Maintenance", column: "type", extra: "NOT NULL"},
}

type Handler struct {
	service *Service
	db      *sql.DB
}

func NewHandler(service *Service, db *sql.DB) *Handler {
	return &Handler{service: service, db: db}
}

func (h *Handler) List(c *gin.Context) {
	category := c.Query("category")
	entries, err := h.service.ListByCategory(c.Request.Context(), category)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "category query parameter is required")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}
	c.JSON(http.StatusOK, entries)
}

func (h *Handler) ListByCategoryPublic(c *gin.Context) {
	category := c.Query("category")
	if category == "" {
		c.JSON(http.StatusOK, []Entry{})
		return
	}
	entries, err := h.service.ListByCategory(c.Request.Context(), category)
	if err != nil {
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}
	c.JSON(http.StatusOK, entries)
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	entry, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
		case errors.Is(err, ErrDuplicate):
			httputil.RespondError(c, http.StatusConflict, err, "duplicate category and key")
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		}
		return
	}

	if err := h.syncEnumColumn(c.Request.Context(), req.Category, req.Key); err != nil {
		log.Printf("warning: failed to sync enum for category %s key %s: %v", req.Category, req.Key, err)
	}

	c.JSON(http.StatusCreated, entry)
}

func (h *Handler) Update(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid id")
		return
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	existing, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	entry, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
		case errors.Is(err, ErrNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "not found")
		case errors.Is(err, ErrDuplicate):
			httputil.RespondError(c, http.StatusConflict, err, "duplicate category and key")
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		}
		return
	}

	if existing.Key != req.Key || existing.Category != req.Category {
		if err := h.syncEnumColumn(c.Request.Context(), req.Category, req.Key); err != nil {
			log.Printf("warning: failed to sync enum for category %s key %s: %v", req.Category, req.Key, err)
		}
	}

	c.JSON(http.StatusOK, entry)
}

func (h *Handler) Delete(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid id")
		return
	}

	err = h.service.Delete(c.Request.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
		case errors.Is(err, ErrNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "not found")
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		}
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *Handler) syncEnumColumn(ctx context.Context, category, newKey string) error {
	mapping, ok := categoryEnumMapping[category]
	if !ok {
		return nil
	}

	var colType string
	if err := h.db.QueryRowContext(ctx,
		"SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
		mapping.table, mapping.column,
	).Scan(&colType); err != nil {
		return err
	}

	enumValues := parseEnumValues(colType)
	for _, v := range enumValues {
		if strings.EqualFold(v, newKey) {
			return nil
		}
	}

	enumValues = append(enumValues, newKey)
	quoted := make([]string, len(enumValues))
	for i, v := range enumValues {
		quoted[i] = "'" + strings.ReplaceAll(v, "'", "''") + "'"
	}
	alterSQL := "ALTER TABLE " + mapping.table + " MODIFY COLUMN " + mapping.column + " ENUM(" + strings.Join(quoted, ",") + ") " + mapping.extra
	_, err := h.db.ExecContext(ctx, alterSQL)
	return err
}

func parseEnumValues(colType string) []string {
	colType = strings.TrimPrefix(colType, "enum(")
	colType = strings.TrimSuffix(colType, ")")
	if colType == "" {
		return nil
	}
	var values []string
	for {
		idx := strings.IndexByte(colType, '\'')
		if idx < 0 {
			break
		}
		colType = colType[idx+1:]
		idx = strings.IndexByte(colType, '\'')
		if idx < 0 {
			break
		}
		values = append(values, colType[:idx])
		colType = colType[idx+1:]
	}
	return values
}

func parseIDParam(c *gin.Context) (int64, error) {
	raw := c.Param("id")
	return strconv.ParseInt(raw, 10, 64)
}
