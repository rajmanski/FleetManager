package costs

import "time"

type Cost struct {
	ID            int64      `json:"id"`
	VehicleID     int64      `json:"vehicleId"`
	Category      string     `json:"category"`
	Amount        float64    `json:"amount"`
	Date          time.Time  `json:"date"`
	Description   *string    `json:"description,omitempty"`
	InvoiceNumber *string    `json:"invoiceNumber,omitempty"`
	CreatedAt     *time.Time `json:"createdAt,omitempty"`
}

type ListCostsQuery struct {
	VehicleID int64
	Page      int32
	Limit     int32
}

type ListCostsResponse struct {
	Data  []Cost `json:"data"`
	Page  int32  `json:"page"`
	Limit int32  `json:"limit"`
	Total int64  `json:"total"`
}

type CreateCostRequest struct {
	VehicleID     int64   `json:"vehicleId" binding:"required"`
	Category      string  `json:"category" binding:"required"`
	Amount        float64 `json:"amount" binding:"required,gt=0"`
	Date          string  `json:"date" binding:"required"`
	Description   string  `json:"description"`
	InvoiceNumber string  `json:"invoiceNumber"`
}

type UpdateCostRequest struct {
	VehicleID     int64   `json:"vehicleId" binding:"required"`
	Category      string  `json:"category" binding:"required"`
	Amount        float64 `json:"amount" binding:"required,gt=0"`
	Date          string  `json:"date" binding:"required"`
	Description   string  `json:"description"`
	InvoiceNumber string  `json:"invoiceNumber"`
}
