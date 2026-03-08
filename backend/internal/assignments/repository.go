package assignments

import (
	"context"
	"time"
)

type Repository interface {
	ListAssignments(ctx context.Context, query ListAssignmentsQuery) ([]Assignment, int64, error)
	GetAssignmentByID(ctx context.Context, assignmentID int64) (Assignment, error)
	CreateAssignment(ctx context.Context, input CreateAssignmentRequest) (int64, error)
	EndAssignment(ctx context.Context, assignmentID int64, endTime time.Time) error
	HasDriverOverlappingAssignment(ctx context.Context, driverID int64, assignedFrom time.Time) (bool, error)
	VehicleExists(ctx context.Context, vehicleID int64) (bool, error)
	DriverExists(ctx context.Context, driverID int64) (bool, error)
}
