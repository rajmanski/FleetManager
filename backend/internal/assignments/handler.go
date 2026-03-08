package assignments

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

func (h *Handler) ListAssignments(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 32)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "50"), 10, 32)
	activeOnly := c.DefaultQuery("active", "false") == "true"

	response, err := h.service.ListAssignments(c.Request.Context(), ListAssignmentsQuery{
		ActiveOnly: activeOnly,
		Page:       int32(page),
		Limit:      int32(limit),
	})
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query params"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *Handler) CreateAssignment(c *gin.Context) {
	var req CreateAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	assignment, err := h.service.CreateAssignment(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		case errors.Is(err, ErrAssignedFromPast):
			c.JSON(http.StatusBadRequest, gin.H{"error": "assigned_from cannot be more than 30 days in the past"})
			return
		case errors.Is(err, ErrVehicleNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found"})
			return
		case errors.Is(err, ErrDriverNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "driver not found"})
			return
		case errors.Is(err, ErrDriverOverlap):
			c.JSON(http.StatusConflict, gin.H{"error": "driver already has overlapping assignment"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
	}

	c.JSON(http.StatusCreated, assignment)
}

func (h *Handler) EndAssignment(c *gin.Context) {
	assignmentID, err := parseAssignmentIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment id"})
		return
	}

	assignment, err := h.service.EndAssignment(c.Request.Context(), assignmentID)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		case errors.Is(err, ErrAssignmentNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "assignment not found"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, assignment)
}

func parseAssignmentIDParam(c *gin.Context) (int64, error) {
	value := c.Param("id")
	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil || id <= 0 {
		return 0, ErrInvalidInput
	}
	return id, nil
}
