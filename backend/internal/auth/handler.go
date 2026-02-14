package auth

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service      *Service
	cookieSecure bool
}

func NewHandler(service *Service, cookieSecure bool) *Handler {
	return &Handler{
		service:      service,
		cookieSecure: cookieSecure,
	}
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	resp, err := h.service.Login(c.Request.Context(), req)
	if err != nil {
		var invalidCredentialsErr *InvalidCredentialsError
		if errors.As(err, &invalidCredentialsErr) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": fmt.Sprintf(
					"Invalid credentials. %d attempts remaining before account lock.",
					invalidCredentialsErr.RemainingAttempts,
				),
			})
			return
		}
		if errors.Is(err, ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		var lockedErr *AccountLockedError
		if errors.As(err, &lockedErr) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": fmt.Sprintf(
					"Account is locked until %s. Try again later or contact administrator.",
					lockedErr.Until.UTC().Format(time.RFC3339),
				),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	h.setRefreshTokenCookie(c, resp.RefreshToken)
	c.JSON(http.StatusOK, resp)
}

func (h *Handler) Refresh(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil || refreshToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing refresh token"})
		return
	}

	resp, err := h.service.RefreshAccessToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired refresh token"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) setRefreshTokenCookie(c *gin.Context, refreshToken string) {
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie(
		"refresh_token",
		refreshToken,
		int(RefreshTokenTTL.Seconds()),
		"/",
		"",
		h.cookieSecure,
		true,
	)
}
