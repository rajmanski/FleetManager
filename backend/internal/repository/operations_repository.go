package repository

import (
	"context"
	"database/sql"
	"fmt"
)

type OperationsRepository struct {
	db *sql.DB
}

func NewOperationsRepository(db *sql.DB) *OperationsRepository {
	return &OperationsRepository{db: db}
}

func (r *OperationsRepository) CreateRoute(
	ctx context.Context,
	orderID int64,
	startLocation string,
	endLocation string,
	plannedDistanceKm *float64,
	estimatedTimeMin *int32,
) (int64, error) {
	var distance any
	if plannedDistanceKm != nil {
		distance = fmt.Sprintf("%.2f", *plannedDistanceKm)
	}

	var etaMinutes any
	if estimatedTimeMin != nil {
		etaMinutes = *estimatedTimeMin
	}

	res, err := r.db.ExecContext(
		ctx,
		`INSERT INTO Routes (order_id, start_location, end_location, planned_distance_km, estimated_time_min)
		 VALUES (?, ?, ?, ?, ?)`,
		orderID,
		sql.NullString{String: startLocation, Valid: startLocation != ""},
		sql.NullString{String: endLocation, Valid: endLocation != ""},
		distance,
		etaMinutes,
	)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return id, nil
}
