package routes

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type geocodeRequest struct {
	Address string `json:"address"`
}

type calculateRequest struct {
	Origin      LatLng   `json:"origin" binding:"required"`
	Destination LatLng   `json:"destination" binding:"required"`
	Waypoints   []LatLng `json:"waypoints"`
}

func (h *Handler) Calculate(c *gin.Context) {
	var req calculateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if req.Waypoints == nil {
		req.Waypoints = []LatLng{}
	}

	result, err := h.service.Calculate(req.Origin, req.Destination, req.Waypoints)
	if err != nil {
		switch {
		case errors.Is(err, ErrAPIKeyNotConfigured):
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "directions service not configured"})
		case errors.Is(err, ErrRouteNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "route not found between points"})
		case errors.Is(err, ErrTooManyWaypoints):
			c.JSON(http.StatusBadRequest, gin.H{"error": "too many waypoints"})
		case errors.Is(err, ErrGeocodingDenied):
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "directions request denied"})
		case errors.Is(err, ErrGeocodingQuotaExceeded):
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "directions quota exceeded"})
		case errors.Is(err, ErrInvalidRequest):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid directions request"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "directions calculation failed"})
		}
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) Geocode(c *gin.Context) {
	var req geocodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	result, err := h.service.Geocode(req.Address)
	if err != nil {
		switch {
		case errors.Is(err, ErrAPIKeyNotConfigured):
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "geocoding service not configured"})
		case errors.Is(err, ErrAddressRequired):
			c.JSON(http.StatusBadRequest, gin.H{"error": "address is required"})
		case errors.Is(err, ErrAddressNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "address not found"})
		case errors.Is(err, ErrGeocodingDenied):
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "geocoding request denied"})
		case errors.Is(err, ErrGeocodingQuotaExceeded):
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "geocoding quota exceeded"})
		case errors.Is(err, ErrInvalidRequest):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid geocoding request"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "geocoding failed"})
		}
		return
	}

	c.JSON(http.StatusOK, result)
}
