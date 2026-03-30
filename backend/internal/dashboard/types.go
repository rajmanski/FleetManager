package dashboard

type Alert struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

type KPIResponse struct {
	ActiveOrders        int64   `json:"active_orders"`
	VehiclesInService   int64   `json:"vehicles_in_service"`
	CurrentMonthCosts   float64 `json:"current_month_costs"`
	CurrentMonthRevenue float64 `json:"current_month_revenue"`
	Alerts              []Alert `json:"alerts"`
}
