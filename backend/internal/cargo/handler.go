package cargo

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

func (h *Handler) ListCargo(c *gin.Context) {
	orderID, err := parseOrderIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
		return
	}
	items, err := h.service.ListCargo(c.Request.Context(), orderID)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h *Handler) GetCargo(c *gin.Context) {
	cargoID, err := parseCargoIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cargo id"})
		return
	}
	cargo, err := h.service.GetCargoByID(c.Request.Context(), cargoID)
	if err != nil {
		if errors.Is(err, ErrCargoNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "cargo not found"})
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, cargo)
}

func (h *Handler) CreateCargo(c *gin.Context) {
	orderID, err := parseOrderIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
		return
	}
	var req CreateCargoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	cargo, err := h.service.CreateCargo(c.Request.Context(), orderID, req)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusCreated, cargo)
}

func (h *Handler) UpdateCargo(c *gin.Context) {
	cargoID, err := parseCargoIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cargo id"})
		return
	}
	var req UpdateCargoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	cargo, err := h.service.UpdateCargo(c.Request.Context(), cargoID, req)
	if err != nil {
		if errors.Is(err, ErrCargoNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "cargo not found"})
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		if errors.Is(err, ErrOrderInProgress) {
			c.JSON(http.StatusForbidden, gin.H{"error": "cannot modify cargo when order is in progress"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, cargo)
}

func (h *Handler) DeleteCargo(c *gin.Context) {
	cargoID, err := parseCargoIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cargo id"})
		return
	}
	err = h.service.DeleteCargo(c.Request.Context(), cargoID)
	if err != nil {
		if errors.Is(err, ErrCargoNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "cargo not found"})
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		if errors.Is(err, ErrOrderInProgress) {
			c.JSON(http.StatusForbidden, gin.H{"error": "cannot delete cargo when order is in progress"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func parseOrderIDParam(c *gin.Context) (int64, error) {
	value := c.Param("id")
	if value == "" {
		return 0, ErrInvalidInput
	}
	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil || id <= 0 {
		return 0, ErrInvalidInput
	}
	return id, nil
}

func parseCargoIDParam(c *gin.Context) (int64, error) {
	value := c.Param("id")
	if value == "" {
		return 0, ErrInvalidInput
	}
	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil || id <= 0 {
		return 0, ErrInvalidInput
	}
	return id, nil
}
