package waypoints

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

func (h *Handler) ListWaypoints(c *gin.Context) {
	routeID, err := parseRouteID(c.Param("route_id"))
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid route id")
		return
	}
	list, err := h.service.ListWaypoints(c.Request.Context(), routeID)
	if err != nil {
		switch {
		case errors.Is(err, ErrRouteIDNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "route not found")
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		}
		return
	}
	if list == nil {
		list = []Waypoint{}
	}
	c.JSON(http.StatusOK, list)
}

func (h *Handler) CreateWaypoint(c *gin.Context) {
	routeID, err := parseRouteID(c.Param("route_id"))
	if err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid route id")
		return
	}
	var req CreateWaypointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}
	wp, err := h.service.CreateWaypoint(c.Request.Context(), routeID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrRouteIDNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "route not found")
		case errors.Is(err, ErrRouteHasActiveTrip):
			httputil.RespondError(c, http.StatusForbidden, err, "cannot modify waypoints: order has active or scheduled trip")
		case errors.Is(err, ErrWaypointLimitExceeded):
			httputil.RespondError(c, http.StatusBadRequest, err, "maximum 10 waypoints per route")
		case errors.Is(err, ErrInvalidWaypointInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid waypoint input")
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		}
		return
	}
	c.JSON(http.StatusCreated, wp)
}

func (h *Handler) UpdateWaypoint(c *gin.Context) {
	waypointID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || waypointID <= 0 {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid waypoint id")
		return
	}
	var req UpdateWaypointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}
	wp, err := h.service.UpdateWaypoint(c.Request.Context(), waypointID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrWaypointNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "waypoint not found")
		case errors.Is(err, ErrRouteHasActiveTrip):
			httputil.RespondError(c, http.StatusForbidden, err, "cannot modify waypoints: order has active or scheduled trip")
		case errors.Is(err, ErrInvalidWaypointInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "invalid waypoint input")
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		}
		return
	}
	c.JSON(http.StatusOK, wp)
}

func (h *Handler) DeleteWaypoint(c *gin.Context) {
	waypointID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || waypointID <= 0 {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid waypoint id")
		return
	}
	err = h.service.DeleteWaypoint(c.Request.Context(), waypointID)
	if err != nil {
		switch {
		case errors.Is(err, ErrWaypointNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "waypoint not found")
		case errors.Is(err, ErrRouteHasActiveTrip):
			httputil.RespondError(c, http.StatusForbidden, err, "cannot modify waypoints: order has active or scheduled trip")
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "waypoint deleted"})
}

func (h *Handler) ReorderWaypoints(c *gin.Context) {
	var req struct {
		Waypoints []struct {
			WaypointID    int64 `json:"waypoint_id"`
			SequenceOrder int32 `json:"sequence_order"`
		} `json:"waypoints"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.RespondError(c, http.StatusBadRequest, err, "invalid request body")
		return
	}
	updates := make([]WaypointReorderItem, 0, len(req.Waypoints))
	for _, w := range req.Waypoints {
		updates = append(updates, WaypointReorderItem{
			WaypointID:    w.WaypointID,
			SequenceOrder: w.SequenceOrder,
		})
	}
	err := h.service.ReorderWaypoints(c.Request.Context(), updates)
	if err != nil {
		switch {
		case errors.Is(err, ErrRouteIDNotFound), errors.Is(err, ErrWaypointNotFound):
			httputil.RespondError(c, http.StatusNotFound, err, "waypoint or route not found")
		case errors.Is(err, ErrRouteHasActiveTrip):
			httputil.RespondError(c, http.StatusForbidden, err, "cannot modify waypoints: order has active or scheduled trip")
		case errors.Is(err, ErrInvalidWaypointInput):
			httputil.RespondError(c, http.StatusBadRequest, err, "sequence_order must be continuous (1,2,3...)")
		default:
			httputil.RespondError(c, http.StatusInternalServerError, err, "internal server error")
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "waypoints reordered"})
}

func parseRouteID(s string) (int64, error) {
	v, err := strconv.ParseInt(s, 10, 64)
	if err != nil || v <= 0 {
		return 0, ErrInvalidWaypointInput
	}
	return v, nil
}
