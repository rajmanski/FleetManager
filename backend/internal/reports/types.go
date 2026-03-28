package reports

type VehicleProfitabilityQuery struct {
	VehicleID int64
	Month     string
}

type VehicleProfitabilityCosts struct {
	Fuel        float64 `json:"fuel"`
	Maintenance float64 `json:"maintenance"`
	Insurance   float64 `json:"insurance"`
	Tolls       float64 `json:"tolls"`
	Total       float64 `json:"total"`
}

type VehicleProfitabilityResponse struct {
	VehicleID int64                     `json:"vehicle_id"`
	Month     string                    `json:"month"`
	Revenue   float64                   `json:"revenue"`
	Costs     VehicleProfitabilityCosts `json:"costs"`
	Profit    float64                   `json:"profit"`
}

type DriverMileageQuery struct {
	DriverID int64
	DateFrom string
	DateTo   string
}

type DriverMileageResponse struct {
	DriverID    int64  `json:"driver_id"`
	Period      string `json:"period"`
	TotalKm     int64  `json:"total_km"`
	OrdersCount int64  `json:"orders_count"`
}

type GlobalCostsQuery struct {
	DateFrom string
	DateTo   string
}

type GlobalCostsByCategory struct {
	Fuel        float64 `json:"fuel"`
	Maintenance float64 `json:"maintenance"`
	Insurance   float64 `json:"insurance"`
	Tolls       float64 `json:"tolls"`
	Other       float64 `json:"other"`
}

type GlobalCostsResponse struct {
	Period            string                `json:"period"`
	CostsByCategory   GlobalCostsByCategory `json:"costs_by_category"`
	Total             float64               `json:"total"`
}
