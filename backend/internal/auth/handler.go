package auth

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

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	resp, err := h.service.Login(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		var lockedErr *AccountLockedError
		if errors.As(err, &lockedErr) {
			c.JSON(http.StatusForbidden, gin.H{"error": "account locked"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, resp)
}
