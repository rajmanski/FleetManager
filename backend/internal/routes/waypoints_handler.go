package routes

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type WaypointsHandler struct {
	service *WaypointsService
}

func NewWaypointsHandler(service *WaypointsService) *WaypointsHandler {
	return &WaypointsHandler{service: service}
}

func (h *WaypointsHandler) ListWaypoints(c *gin.Context) {
	routeID, err := parseRouteID(c.Param("route_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid route id"})
		return
	}
	list, err := h.service.ListWaypoints(c.Request.Context(), routeID)
	if err != nil {
		switch {
		case errors.Is(err, ErrRouteIDNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}
	if list == nil {
		list = []Waypoint{}
	}
	c.JSON(http.StatusOK, list)
}

func (h *WaypointsHandler) CreateWaypoint(c *gin.Context) {
	routeID, err := parseRouteID(c.Param("route_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid route id"})
		return
	}
	var req CreateWaypointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	wp, err := h.service.CreateWaypoint(c.Request.Context(), routeID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrRouteIDNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
		case errors.Is(err, ErrRouteHasActiveTrip):
			c.JSON(http.StatusForbidden, gin.H{"error": "cannot modify waypoints: order has active or scheduled trip"})
		case errors.Is(err, ErrWaypointLimitExceeded):
			c.JSON(http.StatusBadRequest, gin.H{"error": "maximum 10 waypoints per route"})
		case errors.Is(err, ErrInvalidWaypointInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid waypoint input"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}
	c.JSON(http.StatusCreated, wp)
}

func (h *WaypointsHandler) UpdateWaypoint(c *gin.Context) {
	waypointID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || waypointID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid waypoint id"})
		return
	}
	var req UpdateWaypointRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	wp, err := h.service.UpdateWaypoint(c.Request.Context(), waypointID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrWaypointNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "waypoint not found"})
		case errors.Is(err, ErrRouteHasActiveTrip):
			c.JSON(http.StatusForbidden, gin.H{"error": "cannot modify waypoints: order has active or scheduled trip"})
		case errors.Is(err, ErrInvalidWaypointInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid waypoint input"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}
	c.JSON(http.StatusOK, wp)
}

func (h *WaypointsHandler) DeleteWaypoint(c *gin.Context) {
	waypointID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || waypointID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid waypoint id"})
		return
	}
	err = h.service.DeleteWaypoint(c.Request.Context(), waypointID)
	if err != nil {
		switch {
		case errors.Is(err, ErrWaypointNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "waypoint not found"})
		case errors.Is(err, ErrRouteHasActiveTrip):
			c.JSON(http.StatusForbidden, gin.H{"error": "cannot modify waypoints: order has active or scheduled trip"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "waypoint deleted"})
}

func (h *WaypointsHandler) ReorderWaypoints(c *gin.Context) {
	var req struct {
		Waypoints []struct {
			WaypointID    int64 `json:"waypoint_id"`
			SequenceOrder int32 `json:"sequence_order"`
		} `json:"waypoints"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
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
			c.JSON(http.StatusNotFound, gin.H{"error": "waypoint or route not found"})
		case errors.Is(err, ErrRouteHasActiveTrip):
			c.JSON(http.StatusForbidden, gin.H{"error": "cannot modify waypoints: order has active or scheduled trip"})
		case errors.Is(err, ErrInvalidWaypointInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "sequence_order must be continuous (1,2,3...)"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
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
