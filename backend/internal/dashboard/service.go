package dashboard

import "context"

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetKPI(ctx context.Context) (KPIResponse, error) {
	activeOrders, err := s.repo.CountActiveOrders(ctx)
	if err != nil {
		return KPIResponse{}, err
	}

	vehiclesInService, err := s.repo.CountVehiclesInService(ctx)
	if err != nil {
		return KPIResponse{}, err
	}

	currentMonthCosts, err := s.repo.GetCurrentMonthCosts(ctx)
	if err != nil {
		return KPIResponse{}, err
	}

	currentMonthRevenue, err := s.repo.GetCurrentMonthRevenue(ctx)
	if err != nil {
		return KPIResponse{}, err
	}

	insuranceAlerts, err := s.repo.ListExpiringInsuranceAlerts(ctx)
	if err != nil {
		return KPIResponse{}, err
	}

	inspectionAlerts, err := s.repo.ListUpcomingInspectionAlerts(ctx)
	if err != nil {
		return KPIResponse{}, err
	}

	licenseAlerts, err := s.repo.ListExpiringLicenseAlerts(ctx)
	if err != nil {
		return KPIResponse{}, err
	}

	adrAlerts, err := s.repo.ListExpiringAdrAlerts(ctx)
	if err != nil {
		return KPIResponse{}, err
	}

	alerts := make([]Alert, 0, len(insuranceAlerts)+len(inspectionAlerts)+len(licenseAlerts)+len(adrAlerts))
	alerts = append(alerts, insuranceAlerts...)
	alerts = append(alerts, inspectionAlerts...)
	alerts = append(alerts, licenseAlerts...)
	alerts = append(alerts, adrAlerts...)

	return KPIResponse{
		ActiveOrders:        activeOrders,
		VehiclesInService:   vehiclesInService,
		CurrentMonthCosts:   currentMonthCosts,
		CurrentMonthRevenue: currentMonthRevenue,
		Alerts:              alerts,
	}, nil
}
