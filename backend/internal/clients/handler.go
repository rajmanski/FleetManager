package clients

import (
	"errors"
	"net/http"
	"strconv"

	"fleet-management/internal/auth"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListClients(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 32)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "50"), 10, 32)
	search := c.Query("q")
	includeDeleted := c.DefaultQuery("include_deleted", "false") == "true"

	if includeDeleted {
		roleValue, exists := c.Get(auth.ContextRoleKey)
		role, roleOK := roleValue.(string)
		if !exists || !roleOK || role != "Administrator" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
	}

	response, err := h.service.ListClients(c.Request.Context(), ListClientsQuery{
		Search:         search,
		IncludeDeleted: includeDeleted,
		Page:           int32(page),
		Limit:          int32(limit),
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

func (h *Handler) GetClient(c *gin.Context) {
	clientID, err := parseClientIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid client id"})
		return
	}

	client, err := h.service.GetClientByID(c.Request.Context(), clientID)
	if err != nil {
		if errors.Is(err, ErrClientNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "client not found"})
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, client)
}

func (h *Handler) CreateClient(c *gin.Context) {
	var req CreateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	client, err := h.service.CreateClient(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		case errors.Is(err, ErrClientNIPConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "nip already exists"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
	}

	c.JSON(http.StatusCreated, client)
}

func (h *Handler) UpdateClient(c *gin.Context) {
	clientID, err := parseClientIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid client id"})
		return
	}

	var req UpdateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	client, err := h.service.UpdateClient(c.Request.Context(), clientID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		case errors.Is(err, ErrClientNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "client not found"})
			return
		case errors.Is(err, ErrClientNIPConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "nip already exists"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, client)
}

func (h *Handler) DeleteClient(c *gin.Context) {
	clientID, err := parseClientIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid client id"})
		return
	}

	err = h.service.DeleteClient(c.Request.Context(), clientID)
	if err != nil {
		if errors.Is(err, ErrClientNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "client not found"})
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func parseClientIDParam(c *gin.Context) (int64, error) {
	value := c.Param("id")
	clientID, err := strconv.ParseInt(value, 10, 64)
	if err != nil || clientID <= 0 {
		return 0, ErrInvalidInput
	}
	return clientID, nil
}

