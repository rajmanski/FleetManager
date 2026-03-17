package maintenance

import "time"

type Maintenance struct {
	ID           int64      `json:"id"`
	VehicleID    int64      `json:"vehicleId"`
	StartDate    *time.Time `json:"startDate,omitempty"`
	EndDate      *time.Time `json:"endDate,omitempty"`
	Type         string     `json:"type"`
	Status       string     `json:"status"`
	Description  *string    `json:"description,omitempty"`
	LaborCostPln float64    `json:"laborCostPln"`
	PartsCostPln float64    `json:"partsCostPln"`
	TotalCostPln float64    `json:"totalCostPln"`
	CreatedAt    *time.Time `json:"createdAt,omitempty"`
	UpdatedAt    *time.Time `json:"updatedAt,omitempty"`
}

type ListMaintenanceQuery struct {
	VehicleID int64
	Status    string
	Page      int32
	Limit     int32
}

type ListMaintenanceResponse struct {
	Data  []Maintenance `json:"data"`
	Page  int32         `json:"page"`
	Limit int32         `json:"limit"`
	Total int64         `json:"total"`
}

type CreateMaintenanceRequest struct {
	VehicleID    int64    `json:"vehicleId" binding:"required"`
	StartDate    *string  `json:"startDate,omitempty"`
	EndDate      *string  `json:"endDate,omitempty"`
	Type         string   `json:"type" binding:"required"`
	Status       *string  `json:"status,omitempty"`
	Description  *string  `json:"description,omitempty"`
	LaborCostPln *float64 `json:"laborCostPln,omitempty"`
	PartsCostPln *float64 `json:"partsCostPln,omitempty"`
}

type UpdateMaintenanceRequest struct {
	VehicleID    int64    `json:"vehicleId" binding:"required"`
	StartDate    *string  `json:"startDate,omitempty"`
	EndDate      *string  `json:"endDate,omitempty"`
	Type         string   `json:"type" binding:"required"`
	Status       *string  `json:"status,omitempty"`
	Description  *string  `json:"description,omitempty"`
	LaborCostPln *float64 `json:"laborCostPln,omitempty"`
	PartsCostPln *float64 `json:"partsCostPln,omitempty"`
}

type UpdateMaintenanceStatusRequest struct {
	Status string `json:"status" binding:"required"`
}
