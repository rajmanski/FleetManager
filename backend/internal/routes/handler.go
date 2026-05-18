package routes

import (
	"errors"
	"net/http"

	"fleet-management/internal/httputil"

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
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}
	if req.Waypoints == nil {
		req.Waypoints = []LatLng{}
	}

	result, err := h.service.Calculate(req.Origin, req.Destination, req.Waypoints)
	if err != nil {
		switch {
		case errors.Is(err, ErrAPIKeyNotConfigured):
			httputil.RespondError(c, http.StatusServiceUnavailable, err, "directions service not configured")
		case errors.Is(err, ErrRouteNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "route not found between points")
		case errors.Is(err, ErrTooManyWaypoints):
			httputil.RespondError(c, http.StatusBadRequest, err, "too many waypoints")
		case errors.Is(err, ErrGeocodingDenied):
			httputil.RespondError(c, http.StatusServiceUnavailable, err, "directions request denied")
		case errors.Is(err, ErrGeocodingQuotaExceeded):
			httputil.RespondError(c, http.StatusTooManyRequests, err, "directions quota exceeded")
		case errors.Is(err, ErrInvalidRequest):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid directions request")
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "directions calculation failed")
		}
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) Geocode(c *gin.Context) {
	var req geocodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	result, err := h.service.Geocode(req.Address)
	if err != nil {
		switch {
		case errors.Is(err, ErrAPIKeyNotConfigured):
			httputil.RespondError(c, http.StatusServiceUnavailable, err, "geocoding service not configured")
		case errors.Is(err, ErrAddressRequired):
			httputil.RespondError(c, http.StatusBadRequest, err, "address is required")
		case errors.Is(err, ErrAddressNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "address not found")
		case errors.Is(err, ErrGeocodingDenied):
			httputil.RespondError(c, http.StatusServiceUnavailable, err, "geocoding request denied")
		case errors.Is(err, ErrGeocodingQuotaExceeded):
			httputil.RespondError(c, http.StatusTooManyRequests, err, "geocoding quota exceeded")
		case errors.Is(err, ErrInvalidRequest):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid geocoding request")
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "geocoding failed")
		}
		return
	}

	c.JSON(http.StatusOK, result)
}
