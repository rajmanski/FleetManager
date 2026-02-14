package users

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

func (h *Handler) UnlockUser(c *gin.Context) {
	userID, err := parseUserIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	err = h.service.UnlockUserAccount(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		if errors.Is(err, ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) ListAdminUsers(c *gin.Context) {
	users, err := h.service.ListAdminUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *Handler) GetAdminUser(c *gin.Context) {
	userID, err := parseUserIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	user, err := h.service.GetAdminUserByID(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		if errors.Is(err, ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *Handler) CreateAdminUser(c *gin.Context) {
	var req CreateAdminUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	user, err := h.service.CreateAdminUser(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) || errors.Is(err, ErrPasswordTooLong) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (h *Handler) UpdateAdminUser(c *gin.Context) {
	userID, err := parseUserIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var req UpdateAdminUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	user, err := h.service.UpdateAdminUser(c.Request.Context(), userID, req)
	if err != nil {
		if errors.Is(err, ErrInvalidInput) || errors.Is(err, ErrPasswordChangeForbidden) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		if errors.Is(err, ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *Handler) DeleteAdminUser(c *gin.Context) {
	targetUserID, err := parseUserIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
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
			c.JSON(http.StatusForbidden, gin.H{"error": "administrator cannot delete own account"})
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		if errors.Is(err, ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func parseUserIDParam(c *gin.Context) (int64, error) {
	userIDParam := c.Param("id")
	userID, err := strconv.ParseInt(userIDParam, 10, 64)
	if err != nil || userID <= 0 {
		return 0, ErrInvalidInput
	}
	return userID, nil
}
