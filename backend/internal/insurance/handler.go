package insurance

import (
	"errors"
	"net/http"
	"strconv"

	"fleet-management/internal/httputil"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListInsurancePolicies(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 32)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "50"), 10, 32)
	vehicleIDStr := c.Query("vehicle_id")

	var vehicleID int64
	if vehicleIDStr != "" {
		id, err := strconv.ParseInt(vehicleIDStr, 10, 64)
		if err != nil || id <= 0 {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid vehicle_id")
			return
		}
		vehicleID = id
	}

	resp, err := h.service.ListInsurancePolicies(c.Request.Context(), ListInsuranceQuery{
		VehicleID: vehicleID,
		Page:      int32(page),
		Limit:     int32(limit),
	})
	if err != nil {
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid query params")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) GetInsurancePolicy(c *gin.Context) {
	id, err := parseInsurancePolicyIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid insurance policy id")
		return
	}

	p, err := h.service.GetInsurancePolicyByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, ErrPolicyNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "insurance policy not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *Handler) CreateInsurancePolicy(c *gin.Context) {
	var req CreatePolicyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	p, err := h.service.CreateInsurancePolicy(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidPolicyType), errors.Is(err, ErrInvalidDateRange):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusCreated, p)
}

func (h *Handler) UpdateInsurancePolicy(c *gin.Context) {
	id, err := parseInsurancePolicyIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid insurance policy id")
		return
	}

	var req UpdatePolicyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	p, err := h.service.UpdateInsurancePolicy(c.Request.Context(), id, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidPolicyType), errors.Is(err, ErrInvalidDateRange):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrPolicyNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "insurance policy not found")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, p)
}

func (h *Handler) DeleteInsurancePolicy(c *gin.Context) {
	id, err := parseInsurancePolicyIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid insurance policy id")
		return
	}

	err = h.service.DeleteInsurancePolicy(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, ErrPolicyNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "insurance policy not found")
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

func parseInsurancePolicyIDParam(c *gin.Context) (int64, error) {
	return httputil.ParsePositiveInt64Param(c, "id")
}
