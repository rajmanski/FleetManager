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
