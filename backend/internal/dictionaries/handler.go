package dictionaries

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

func parseIDParam(c *gin.Context) (int64, error) {
	raw := c.Param("id")
	return strconv.ParseInt(raw, 10, 64)
}
