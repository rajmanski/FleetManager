package users

import (
	"errors"
	"net/http"

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

func (h *Handler) UnlockUser(c *gin.Context) {
	userID, err := parseUserIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid user id")
		return
	}

	err = h.service.UnlockUserAccount(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		if errors.Is(err, ErrUserNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "user not found")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) ListAdminUsers(c *gin.Context) {
	users, err := h.service.ListAdminUsers(c.Request.Context())
	if err != nil {
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *Handler) GetAdminUser(c *gin.Context) {
	userID, err := parseUserIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid user id")
		return
	}

	user, err := h.service.GetAdminUserByID(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		if errors.Is(err, ErrUserNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "user not found")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *Handler) CreateAdminUser(c *gin.Context) {
	var req CreateAdminUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	user, err := h.service.CreateAdminUser(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) || errors.Is(err, ErrPasswordTooLong) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (h *Handler) UpdateAdminUser(c *gin.Context) {
	userID, err := parseUserIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid user id")
		return
	}

	var req UpdateAdminUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	user, err := h.service.UpdateAdminUser(c.Request.Context(), userID, req)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) || errors.Is(err, ErrPasswordChangeForbidden) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		if errors.Is(err, ErrUserNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "user not found")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *Handler) DeleteAdminUser(c *gin.Context) {
	targetUserID, err := parseUserIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid user id")
		return
	}

	requesterIDValue, exists := c.Get(auth.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	requesterUserID, ok := requesterIDValue.(int64)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	err = h.service.DeleteAdminUser(c.Request.Context(), targetUserID, requesterUserID)
	if err != nil {
		if errors.Is(err, ErrSelfDeleteForbidden) {
			httputil.RespondError(c, http.StatusForbidden, err, "administrator cannot delete own account")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		if errors.Is(err, ErrUserNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "user not found")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func parseUserIDParam(c *gin.Context) (int64, error) {
	return httputil.ParsePositiveInt64Param(c, "id")
}
