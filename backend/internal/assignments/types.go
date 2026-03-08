package assignments

import "time"

type Assignment struct {
	AssignmentID int64      `json:"assignment_id"`
	VehicleID    int64      `json:"vehicle_id"`
	DriverID     int64      `json:"driver_id"`
	AssignedFrom time.Time  `json:"assigned_from"`
	AssignedTo   *time.Time `json:"assigned_to,omitempty"`
	VehicleVIN   string     `json:"vehicle_vin,omitempty"`
	VehicleBrand string     `json:"vehicle_brand,omitempty"`
	VehicleModel string     `json:"vehicle_model,omitempty"`
	DriverName   string     `json:"driver_name,omitempty"`
}

type ListAssignmentsQuery struct {
	ActiveOnly bool
	Page       int32
	Limit      int32
}

type ListAssignmentsResponse struct {
	Data  []Assignment `json:"data"`
	Page  int32        `json:"page"`
	Limit int32        `json:"limit"`
	Total int64        `json:"total"`
}

type CreateAssignmentRequest struct {
	VehicleID    int64     `json:"vehicle_id" binding:"required"`
	DriverID     int64     `json:"driver_id" binding:"required"`
	AssignedFrom time.Time `json:"assigned_from" binding:"required"`
}
