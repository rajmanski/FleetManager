package trips

import "time"

type Trip struct {
	ID               int64      `json:"id"`
	OrderID          int64      `json:"order_id"`
	OrderNumber      string     `json:"order_number"`
	ClientCompany    string     `json:"client_company"`
	VehicleID        int64      `json:"vehicle_id"`
	VehicleVIN       string     `json:"vehicle_vin"`
	DriverID         int64      `json:"driver_id"`
	DriverName       string     `json:"driver_name"`
	PlannedDistanceKm *int32    `json:"planned_distance_km,omitempty"`
	StartTime        *time.Time `json:"start_time,omitempty"`
	EndTime          *time.Time `json:"end_time,omitempty"`
	ActualDistanceKm *int32     `json:"actual_distance_km,omitempty"`
	Status           string     `json:"status"`
}

type ListTripsQuery struct {
	Status string
}

type CreateTripRequest struct {
	OrderID   int64     `json:"order_id" binding:"required"`
	VehicleID int64     `json:"vehicle_id" binding:"required"`
	DriverID  int64     `json:"driver_id" binding:"required"`
	StartTime time.Time `json:"start_time" binding:"required"`
}

type FinishTripRequest struct {
	ActualDistanceKm int32 `json:"actual_distance_km" binding:"required"`
}
