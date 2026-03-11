package trips

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

func (h *Handler) ListTrips(c *gin.Context) {
	status := c.Query("status")
	rows, err := h.service.ListTrips(c.Request.Context(), ListTripsQuery{Status: status})
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query params"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func (h *Handler) GetTrip(c *gin.Context) {
	tripID, err := parseTripIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip id"})
		return
	}

	trip, err := h.service.GetTripByID(c.Request.Context(), tripID)
	if err != nil {
		if errors.Is(err, ErrTripNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "trip not found"})
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, trip)
}

func (h *Handler) CreateTrip(c *gin.Context) {
	var req CreateTripRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	trip, err := h.service.CreateTrip(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		case IsCargoExceedsCapacity(err):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		case errors.Is(err, ErrValidationFailed):
			c.JSON(http.StatusForbidden, gin.H{"error": "validation failed"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
	}

	c.JSON(http.StatusCreated, trip)
}

func (h *Handler) StartTrip(c *gin.Context) {
	tripID, err := parseTripIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip id"})
		return
	}

	trip, err := h.service.StartTrip(c.Request.Context(), tripID)
	if err != nil {
		if errors.Is(err, ErrTripNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "trip not found"})
			return
		}
		if errors.Is(err, ErrInvalidState) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip state"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, trip)
}

func (h *Handler) FinishTrip(c *gin.Context) {
	tripID, err := parseTripIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip id"})
		return
	}

	var req FinishTripRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	trip, err := h.service.FinishTrip(c.Request.Context(), tripID, req.ActualDistanceKm)
	if err != nil {
		if errors.Is(err, ErrTripNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "trip not found"})
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		if errors.Is(err, ErrInvalidState) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip state"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, trip)
}

func (h *Handler) AbortTrip(c *gin.Context) {
	tripID, err := parseTripIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip id"})
		return
	}

	trip, err := h.service.AbortTrip(c.Request.Context(), tripID)
	if err != nil {
		if errors.Is(err, ErrTripNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "trip not found"})
			return
		}
		if errors.Is(err, ErrInvalidState) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trip state"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, trip)
}

func parseTripIDParam(c *gin.Context) (int64, error) {
	value := c.Param("id")
	tripID, err := strconv.ParseInt(value, 10, 64)
	if err != nil || tripID <= 0 {
		return 0, ErrInvalidInput
	}
	return tripID, nil
}

