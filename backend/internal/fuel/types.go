package fuel

import "time"

type CreateFuelRequest struct {
	VehicleID    int64   `json:"vehicle_id" binding:"required"`
	Date         string  `json:"date" binding:"required"`
	Liters       float64 `json:"liters" binding:"required,gte=0"`
	PricePerLiter float64 `json:"price_per_liter" binding:"required,gte=0"`
	Mileage      int64   `json:"mileage" binding:"required,gte=0"`
	Location     string  `json:"location" binding:"required,min=1"`
}

type FuelLog struct {
	ID             int64      `json:"id"`
	VehicleID     int64      `json:"vehicle_id"`
	Date          time.Time  `json:"date"`
	Liters        float64    `json:"liters"`
	PricePerLiter float64    `json:"price_per_liter"`
	TotalCost     float64    `json:"total_cost"`
	Mileage       int64      `json:"mileage"`
	Location      string     `json:"location"`
	CreatedAt     *time.Time `json:"created_at,omitempty"`
	HasAlert      bool       `json:"has_alert"`
}

type ListFuelLogsQuery struct {
	VehicleID int64
	DateFrom  string
	DateTo    string
	Page       int32
	Limit      int32
}

type ListFuelLogsResponse struct {
	Data  []FuelLog `json:"data"`
	Page  int32      `json:"page"`
	Limit int32      `json:"limit"`
	Total int64      `json:"total"`
}

type FuelAlert struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

type CreateFuelResponse struct {
	FuelLogID             int64      `json:"fuel_log_id"`
	TotalCost             float64    `json:"total_cost"`
	ConsumptionPer100km   float64    `json:"consumption_per_100km"`
	Alert                 *FuelAlert `json:"alert,omitempty"`
}

type CreateFuelRepositoryInput struct {
	VehicleID     int64
	Date          time.Time
	Liters        float64
	PricePerLiter float64
	TotalCost     float64
	Mileage       int64
	Location      string
}

type CreateFuelAlertInput struct {
	FuelLogID int64
	Message   string
}

type FuelNormInput struct {
	CurrentConsumptionPer100km float64
	NormConsumptionPer100km    float64
}

