package orders

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

func (h *Handler) ListOrders(c *gin.Context) {
	page, _ := strconv.ParseInt(c.DefaultQuery("page", "1"), 10, 32)
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "50"), 10, 32)
	statusFilter := c.Query("status")
	search := c.Query("q")

	response, err := h.service.ListOrders(c.Request.Context(), ListOrdersQuery{
		StatusFilter: statusFilter,
		Search:       search,
		Page:         int32(page),
		Limit:        int32(limit),
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

func (h *Handler) GetOrder(c *gin.Context) {
	orderID, err := parseOrderIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid order id")
		return
	}

	order, err := h.service.GetOrderByID(c.Request.Context(), orderID)
	if err != nil {
		if errors.Is(err, ErrOrderNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "order not found")
			return
		}
		if errors.Is(err, ErrInvalidInput) {
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		}
		httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		return
	}

	c.JSON(http.StatusOK, order)
}

func (h *Handler) CreateOrder(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	order, err := h.service.CreateOrder(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrOrderNumberExists):
			httputil.RespondError(c, http.StatusConflict, err, "order number already exists")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusCreated, order)
}

func (h *Handler) UpdateOrder(c *gin.Context) {
	orderID, err := parseOrderIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid order id")
		return
	}

	var req UpdateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}

	order, err := h.service.UpdateOrder(c.Request.Context(), orderID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid input")
			return
		case errors.Is(err, ErrOrderNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "order not found")
			return
		case errors.Is(err, ErrOrderNumberExists):
			httputil.RespondError(c, http.StatusConflict, err, "order number already exists")
			return
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
			return
		}
	}

	c.JSON(http.StatusOK, order)
}

func (h *Handler) DeleteOrder(c *gin.Context) {
	orderID, err := parseOrderIDParam(c)
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid order id")
		return
	}

	err = h.service.DeleteOrder(c.Request.Context(), orderID)
	if err != nil {
		if errors.Is(err, ErrOrderNotFound) {
			httputil.RespondError(c, http.StatusNotFound, err, "order not found")
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

func parseOrderIDParam(c *gin.Context) (int64, error) {
	return httputil.ParsePositiveInt64Param(c, "id")
}
