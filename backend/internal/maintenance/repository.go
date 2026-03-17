package maintenance

import "context"

type Repository interface {
	ListMaintenance(ctx context.Context, query ListMaintenanceQuery) ([]Maintenance, int64, error)
	GetMaintenanceByID(ctx context.Context, maintenanceID int64) (Maintenance, error)
	CreateMaintenance(ctx context.Context, input CreateMaintenanceRequest) (int64, error)
	UpdateMaintenance(ctx context.Context, maintenanceID int64, input UpdateMaintenanceRequest) error
	UpdateMaintenanceStatus(ctx context.Context, maintenanceID int64, status string) error
}

