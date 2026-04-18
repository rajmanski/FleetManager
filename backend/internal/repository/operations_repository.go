package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"fleet-management/internal/operations"
)

type OperationsRepository struct {
	db *sql.DB
}

func NewOperationsRepository(db *sql.DB) *OperationsRepository {
	return &OperationsRepository{db: db}
}

func (r *OperationsRepository) ExecutePlannedOrderWorkflowTx(
	ctx context.Context,
	req operations.PlanOrderWorkflowRequest,
) (operations.PlanOrderWorkflowResponse, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return operations.PlanOrderWorkflowResponse{}, err
	}
	defer func() { _ = tx.Rollback() }()

	startTime, err := time.Parse(time.RFC3339, strings.TrimSpace(req.Trip.StartTime))
	if err != nil {
		return operations.PlanOrderWorkflowResponse{}, &operations.ValidationError{
			Message: "workflow validation failed",
			FieldErrors: []operations.FieldError{
				{
					Field:   "trip.start_time",
					Code:    "INVALID_DATETIME",
					Message: "trip.start_time must be a valid RFC3339 datetime",
				},
			},
		}
	}

	orderID, err := r.insertOrderTx(ctx, tx, req.Order)
	if err != nil {
		return operations.PlanOrderWorkflowResponse{}, err
	}

	routeID, err := r.insertRouteTx(ctx, tx, orderID, req.Route)
	if err != nil {
		return operations.PlanOrderWorkflowResponse{}, err
	}

	waypointIDByTempID, err := r.insertWaypointsTx(ctx, tx, routeID, req.Route.Waypoints)
	if err != nil {
		return operations.PlanOrderWorkflowResponse{}, err
	}

	totalWeight, err := r.insertCargoTx(ctx, tx, orderID, req.Cargo, waypointIDByTempID)
	if err != nil {
		return operations.PlanOrderWorkflowResponse{}, err
	}

	if err := r.validateVehicleAvailabilityTx(ctx, tx, req.Trip.VehicleID, startTime); err != nil {
		return operations.PlanOrderWorkflowResponse{}, err
	}
	if err := r.validateDriverAvailabilityTx(ctx, tx, req.Trip.DriverID, startTime); err != nil {
		return operations.PlanOrderWorkflowResponse{}, err
	}
	if err := r.validateADRCapabilityTx(ctx, tx, req.Trip.DriverID, orderID); err != nil {
		return operations.PlanOrderWorkflowResponse{}, err
	}
	if err := r.validateCapacityTx(ctx, tx, req.Trip.VehicleID, totalWeight); err != nil {
		return operations.PlanOrderWorkflowResponse{}, err
	}

	tripID, err := r.insertTripTx(ctx, tx, orderID, req.Trip, startTime)
	if err != nil {
		return operations.PlanOrderWorkflowResponse{}, err
	}

	if err := tx.Commit(); err != nil {
		return operations.PlanOrderWorkflowResponse{}, err
	}

	var distanceKm float64
	if req.Route.PlannedDistanceKm != nil {
		distanceKm = *req.Route.PlannedDistanceKm
	}
	var estimatedMinutes int32
	if req.Route.EstimatedTimeMin != nil {
		estimatedMinutes = *req.Route.EstimatedTimeMin
	}

	return operations.PlanOrderWorkflowResponse{
		Status: "planned",
		Order: operations.PlannedOrderSummary{
			ID:          orderID,
			OrderNumber: strings.TrimSpace(req.Order.OrderNumber),
			Status:      "InProgress",
		},
		Route: operations.PlannedRouteSummary{
			ID:                routeID,
			PlannedDistanceKm: req.Route.PlannedDistanceKm,
			EstimatedTimeMin:  req.Route.EstimatedTimeMin,
		},
		Trip: operations.PlannedTripSummary{
			ID:        tripID,
			Status:    "Scheduled",
			VehicleID: req.Trip.VehicleID,
			DriverID:  req.Trip.DriverID,
			StartTime: startTime.UTC().Format(time.RFC3339),
		},
		Summary: operations.PlannedOrderOverview{
			CargoCount:       len(req.Cargo),
			TotalWeightKg:    totalWeight,
			WaypointsCount:   len(req.Route.Waypoints),
			DistanceKm:       distanceKm,
			EstimatedTimeMin: estimatedMinutes,
		},
	}, nil
}

func (r *OperationsRepository) insertOrderTx(
	ctx context.Context,
	tx *sql.Tx,
	order operations.PlanOrderInput,
) (int64, error) {
	var deliveryDeadline any
	if order.DeliveryDeadline != nil && strings.TrimSpace(*order.DeliveryDeadline) != "" {
		if t, err := time.Parse("2006-01-02", strings.TrimSpace(*order.DeliveryDeadline)); err == nil {
			deliveryDeadline = t
		}
	}
	var totalPrice any
	if order.TotalPricePln != nil {
		totalPrice = fmt.Sprintf("%.2f", *order.TotalPricePln)
	}

	res, err := tx.ExecContext(
		ctx,
		`INSERT INTO Orders (client_id, order_number, delivery_deadline, total_price_pln, status)
		 VALUES (?, ?, ?, ?, ?)`,
		order.ClientID,
		strings.TrimSpace(order.OrderNumber),
		deliveryDeadline,
		totalPrice,
		"Planned",
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *OperationsRepository) insertRouteTx(
	ctx context.Context,
	tx *sql.Tx,
	orderID int64,
	route operations.PlanRouteInput,
) (int64, error) {
	var distance any
	if route.PlannedDistanceKm != nil {
		distance = fmt.Sprintf("%.2f", *route.PlannedDistanceKm)
	}
	var etaMinutes any
	if route.EstimatedTimeMin != nil {
		etaMinutes = *route.EstimatedTimeMin
	}

	res, err := tx.ExecContext(
		ctx,
		`INSERT INTO Routes (order_id, start_location, end_location, planned_distance_km, estimated_time_min)
		 VALUES (?, ?, ?, ?, ?)`,
		orderID,
		sql.NullString{String: strings.TrimSpace(route.StartLocation), Valid: strings.TrimSpace(route.StartLocation) != ""},
		sql.NullString{String: strings.TrimSpace(route.EndLocation), Valid: strings.TrimSpace(route.EndLocation) != ""},
		distance,
		etaMinutes,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *OperationsRepository) insertWaypointsTx(
	ctx context.Context,
	tx *sql.Tx,
	routeID int64,
	waypoints []operations.PlanWaypoint,
) (map[string]int64, error) {
	byTempID := make(map[string]int64, len(waypoints))
	for _, wp := range waypoints {
		res, err := tx.ExecContext(
			ctx,
			`INSERT INTO RouteWaypoints (route_id, sequence_order, address, latitude, longitude, action_type)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			routeID,
			wp.SequenceOrder,
			strings.TrimSpace(wp.Address),
			fmt.Sprintf("%.7f", wp.Latitude),
			fmt.Sprintf("%.7f", wp.Longitude),
			strings.TrimSpace(wp.ActionType),
		)
		if err != nil {
			return nil, err
		}
		id, err := res.LastInsertId()
		if err != nil {
			return nil, err
		}
		byTempID[strings.TrimSpace(wp.TempID)] = id
	}
	return byTempID, nil
}

func (r *OperationsRepository) insertCargoTx(
	ctx context.Context,
	tx *sql.Tx,
	orderID int64,
	cargoItems []operations.PlanCargo,
	waypointIDByTempID map[string]int64,
) (float64, error) {
	totalWeight := 0.0
	for _, item := range cargoItems {
		var waypointID any
		if item.DestinationWaypointTempID != nil && strings.TrimSpace(*item.DestinationWaypointTempID) != "" {
			id, ok := waypointIDByTempID[strings.TrimSpace(*item.DestinationWaypointTempID)]
			if !ok {
				return 0, &operations.ValidationError{
					Message: "workflow validation failed",
					FieldErrors: []operations.FieldError{
						{
							Field:   "cargo.destination_waypoint_temp_id",
							Code:    "WAYPOINT_REFERENCE_NOT_FOUND",
							Message: "destination waypoint temp_id does not exist",
						},
					},
				}
			}
			waypointID = id
		}

		if _, err := tx.ExecContext(
			ctx,
			`INSERT INTO Cargo (order_id, destination_waypoint_id, description, weight_kg, volume_m3, cargo_type)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			orderID,
			waypointID,
			strings.TrimSpace(item.Description),
			item.WeightKg,
			item.VolumeM3,
			strings.TrimSpace(item.CargoType),
		); err != nil {
			return 0, err
		}
		totalWeight += item.WeightKg
	}

	return totalWeight, nil
}

func (r *OperationsRepository) validateVehicleAvailabilityTx(
	ctx context.Context,
	tx *sql.Tx,
	vehicleID int64,
	startTime time.Time,
) error {
	var status string
	if err := tx.QueryRowContext(ctx, `SELECT status FROM Vehicles WHERE vehicle_id = ? LIMIT 1`, vehicleID).Scan(&status); err != nil {
		return err
	}
	if status != "Available" {
		return &operations.ValidationError{
			Message: "workflow validation failed",
			FieldErrors: []operations.FieldError{
				{Field: "trip.vehicle_id", Code: "VEHICLE_UNAVAILABLE", Message: fmt.Sprintf("vehicle status is %s", status)},
			},
		}
	}

	date := startTime.Format("2006-01-02")
	var tripsCount int64
	if err := tx.QueryRowContext(
		ctx,
		`SELECT COUNT(*) FROM Trips WHERE vehicle_id = ? AND status IN ('Scheduled','Active') AND DATE(start_time) = ?`,
		vehicleID,
		date,
	).Scan(&tripsCount); err != nil {
		return err
	}
	if tripsCount > 0 {
		return &operations.ValidationError{
			Message: "workflow validation failed",
			FieldErrors: []operations.FieldError{
				{Field: "trip.vehicle_id", Code: "VEHICLE_CONFLICT", Message: "vehicle already has scheduled or active trip in selected time range"},
			},
		}
	}
	return nil
}

func (r *OperationsRepository) validateDriverAvailabilityTx(
	ctx context.Context,
	tx *sql.Tx,
	driverID int64,
	startTime time.Time,
) error {
	var status string
	if err := tx.QueryRowContext(ctx, `SELECT status FROM Drivers WHERE driver_id = ? LIMIT 1`, driverID).Scan(&status); err != nil {
		return err
	}
	if status != "Available" {
		return &operations.ValidationError{
			Message: "workflow validation failed",
			FieldErrors: []operations.FieldError{
				{Field: "trip.driver_id", Code: "DRIVER_UNAVAILABLE", Message: fmt.Sprintf("driver status is %s", status)},
			},
		}
	}

	date := startTime.Format("2006-01-02")
	var tripsCount int64
	if err := tx.QueryRowContext(
		ctx,
		`SELECT COUNT(*) FROM Trips WHERE driver_id = ? AND status IN ('Scheduled','Active') AND DATE(start_time) = ?`,
		driverID,
		date,
	).Scan(&tripsCount); err != nil {
		return err
	}
	if tripsCount > 0 {
		return &operations.ValidationError{
			Message: "workflow validation failed",
			FieldErrors: []operations.FieldError{
				{Field: "trip.driver_id", Code: "DRIVER_CONFLICT", Message: "driver already has scheduled or active trip in selected time range"},
			},
		}
	}
	return nil
}

func (r *OperationsRepository) validateADRCapabilityTx(
	ctx context.Context,
	tx *sql.Tx,
	driverID int64,
	orderID int64,
) error {
	var hazardousCount int64
	if err := tx.QueryRowContext(
		ctx,
		`SELECT COUNT(*) FROM Cargo WHERE order_id = ? AND cargo_type = 'Hazardous'`,
		orderID,
	).Scan(&hazardousCount); err != nil {
		return err
	}
	if hazardousCount == 0 {
		return nil
	}

	var adrCertified bool
	var adrExpiry sql.NullTime
	if err := tx.QueryRowContext(
		ctx,
		`SELECT adr_certified, adr_expiry_date FROM Drivers WHERE driver_id = ? LIMIT 1`,
		driverID,
	).Scan(&adrCertified, &adrExpiry); err != nil {
		return err
	}
	if !adrCertified {
		return &operations.ValidationError{
			Message: "workflow validation failed",
			FieldErrors: []operations.FieldError{
				{Field: "trip.driver_id", Code: "ADR_REQUIRED", Message: "selected driver cannot transport hazardous cargo"},
			},
		}
	}
	if adrExpiry.Valid && adrExpiry.Time.Before(time.Now()) {
		return &operations.ValidationError{
			Message: "workflow validation failed",
			FieldErrors: []operations.FieldError{
				{Field: "trip.driver_id", Code: "ADR_EXPIRED", Message: "driver ADR certificate is expired"},
			},
		}
	}
	return nil
}

func (r *OperationsRepository) validateCapacityTx(
	ctx context.Context,
	tx *sql.Tx,
	vehicleID int64,
	totalWeight float64,
) error {
	var capacity sql.NullInt64
	if err := tx.QueryRowContext(ctx, `SELECT capacity_kg FROM Vehicles WHERE vehicle_id = ? LIMIT 1`, vehicleID).Scan(&capacity); err != nil {
		return err
	}
	if capacity.Valid && capacity.Int64 > 0 && totalWeight > float64(capacity.Int64) {
		return &operations.ValidationError{
			Message: "workflow validation failed",
			GlobalErrors: []operations.FieldError{
				{Code: "CAPACITY_EXCEEDED", Message: fmt.Sprintf("total cargo weight %.2f exceeds vehicle capacity %d", totalWeight, capacity.Int64)},
			},
		}
	}
	return nil
}

func (r *OperationsRepository) insertTripTx(
	ctx context.Context,
	tx *sql.Tx,
	orderID int64,
	trip operations.PlanTripInput,
	startTime time.Time,
) (int64, error) {
	res, err := tx.ExecContext(
		ctx,
		`INSERT INTO Trips (order_id, vehicle_id, driver_id, start_time, status)
		 VALUES (?, ?, ?, ?, ?)`,
		orderID,
		trip.VehicleID,
		trip.DriverID,
		startTime.UTC(),
		"Scheduled",
	)
	if err != nil {
		return 0, err
	}
	tripID, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	if _, err := tx.ExecContext(ctx, `UPDATE Vehicles SET status = 'InRoute' WHERE vehicle_id = ?`, trip.VehicleID); err != nil {
		return 0, err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE Drivers SET status = 'InRoute' WHERE driver_id = ?`, trip.DriverID); err != nil {
		return 0, err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE Orders SET status = 'InProgress' WHERE order_id = ?`, orderID); err != nil {
		return 0, err
	}

	return tripID, nil
}
