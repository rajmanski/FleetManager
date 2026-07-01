package auth

import (
	"errors"
	"fmt"
	"net/http"

	"fleet-management/internal/httputil"

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
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
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
					lockedErr.Until.Format("2006-01-02 15:04:05 (MST)"),
				),
			})
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	h.setRefreshTokenCookie(c, resp.RefreshToken)
	c.JSON(http.StatusOK, resp)
}

func (h *Handler) Refresh(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil || refreshToken == "" {
		httputil.RespondError(c, http.StatusUnauthorized, err, "missing refresh token")
		return
	}

	resp, err := h.service.RefreshAccessToken(refreshToken)
	if err != nil {
		httputil.RespondError(c, http.StatusUnauthorized, err, "invalid or expired refresh token")
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) Logout(c *gin.Context) {
	h.clearRefreshTokenCookie(c)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
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

func (h *Handler) clearRefreshTokenCookie(c *gin.Context) {
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie(
		"refresh_token",
		"",
		-1,
		"/",
		"",
		h.cookieSecure,
		true,
	)
}
