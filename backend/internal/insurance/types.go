package insurance

import "time"

type Policy struct {
	ID           int64      `json:"id"`
	VehicleID    int64      `json:"vehicleId"`
	Type         string     `json:"type"`
	PolicyNumber string     `json:"policyNumber"`
	Insurer      string     `json:"insurer"`
	StartDate    time.Time  `json:"startDate"`
	EndDate      time.Time  `json:"endDate"`
	Cost         float64    `json:"cost"`
	CreatedAt    *time.Time `json:"createdAt,omitempty"`
	UpdatedAt    *time.Time `json:"updatedAt,omitempty"`
}

type ListInsuranceQuery struct {
	VehicleID int64
	Page      int32
	Limit     int32
}

type ListInsuranceResponse struct {
	Data  []Policy `json:"data"`
	Page  int32    `json:"page"`
	Limit int32    `json:"limit"`
	Total int64    `json:"total"`
}

type CreatePolicyRequest struct {
	VehicleID    int64   `json:"vehicleId" binding:"required"`
	Type         string  `json:"type" binding:"required"`
	PolicyNumber string  `json:"policyNumber" binding:"required"`
	Insurer      string  `json:"insurer" binding:"required"`
	StartDate    *string `json:"startDate" binding:"required"`
	EndDate      *string `json:"endDate" binding:"required"`
	Cost         float64 `json:"cost" binding:"gte=0"`
}

type UpdatePolicyRequest struct {
	VehicleID    int64   `json:"vehicleId" binding:"required"`
	Type         string  `json:"type" binding:"required"`
	PolicyNumber string  `json:"policyNumber" binding:"required"`
	Insurer      string  `json:"insurer" binding:"required"`
	StartDate    *string `json:"startDate" binding:"required"`
	EndDate      *string `json:"endDate" binding:"required"`
	Cost         float64 `json:"cost" binding:"gte=0"`
}
