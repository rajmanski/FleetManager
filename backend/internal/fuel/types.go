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
	AlertType string
	Message   string
}

type FuelNormInput struct {
	CurrentConsumptionPer100km float64
	NormConsumptionPer100km    float64
}

