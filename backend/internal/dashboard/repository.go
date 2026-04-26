package dashboard

import "context"

type Repository interface {
	CountActiveOrders(ctx context.Context) (int64, error)
	CountVehiclesInService(ctx context.Context) (int64, error)
	GetCurrentMonthCosts(ctx context.Context) (float64, error)
	GetCurrentMonthRevenue(ctx context.Context) (float64, error)
	ListExpiringInsuranceAlerts(ctx context.Context) ([]Alert, error)
	ListUpcomingInspectionAlerts(ctx context.Context) ([]Alert, error)
	ListExpiringLicenseAlerts(ctx context.Context) ([]Alert, error)
	ListExpiringAdrAlerts(ctx context.Context) ([]Alert, error)
}
