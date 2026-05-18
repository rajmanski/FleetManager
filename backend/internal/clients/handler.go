package clients

import (
	"errors"
	"net/http"
	"strconv"

	"fleet-management/internal/auth"
	"fleet-management/internal/httputil"

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
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid query params")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *Handler) GetClient(c *gin.Context) {
	clientID, err := parseClientIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid client id")
		return
	}

	client, err := h.service.GetClientByID(c.Request.Context(), clientID)
	if err != nil {
		if errors.Is(err, ErrClientNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "client not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, client)
}

func (h *Handler) CreateClient(c *gin.Context) {
	var req CreateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	client, err := h.service.CreateClient(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrClientNIPConflict):
			httputil.RespondError(c, http.StatusConflict, err, "nip already exists")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusCreated, client)
}

func (h *Handler) UpdateClient(c *gin.Context) {
	clientID, err := parseClientIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid client id")
		return
	}

	var req UpdateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	client, err := h.service.UpdateClient(c.Request.Context(), clientID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrClientNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "client not found")
			return
		case errors.Is(err, ErrClientNIPConflict):
			httputil.RespondError(c, http.StatusConflict, err, "nip already exists")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, client)
}

func (h *Handler) DeleteClient(c *gin.Context) {
	clientID, err := parseClientIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid client id")
		return
	}

	err = h.service.DeleteClient(c.Request.Context(), clientID)
	if err != nil {
		if errors.Is(err, ErrClientNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "client not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) RestoreClient(c *gin.Context) {
	roleValue, exists := c.Get(auth.ContextRoleKey)
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	role, ok := roleValue.(string)
	if !ok || role != "Administrator" {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	clientID, err := parseClientIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid client id")
		return
	}

	client, err := h.service.RestoreClient(c.Request.Context(), clientID)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrClientNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "client not found")
			return
		case errors.Is(err, ErrClientRestoreConflict):
			httputil.RespondError(c, http.StatusConflict, err, "nip conflicts with another active client")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, client)
}

func parseClientIDParam(c *gin.Context) (int64, error) {
	return httputil.ParsePositiveInt64Param(c, "id")
}
