package certificates

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	sqlc "fleet-management/internal/db/sqlc"
)

type Service struct {
	queries *sqlc.Queries
}

func NewService(queries *sqlc.Queries) *Service {
	return &Service{queries: queries}
}

type ExpiringAlert struct {
	AlertID   int64  `json:"alert_id"`
	DriverID  int32  `json:"driver_id"`
	AlertType string `json:"alert_type"`
	Message   string `json:"message"`
}

func (s *Service) CheckExpiringCertificates(ctx context.Context) ([]ExpiringAlert, error) {
	rows, err := s.queries.ListDriversWithExpiringCertificates(ctx)
	if err != nil {
		return nil, err
	}

	var alerts []ExpiringAlert
	for _, row := range rows {
		vehicleID, err := s.queries.GetActiveAssignmentVehicleID(ctx, row.DriverID)
		hasVehicle := err == nil
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return nil, err
		}

		vehicleIDNull := sql.NullInt32{}
		if hasVehicle {
			vehicleIDNull = sql.NullInt32{Int32: vehicleID, Valid: true}
		}

		if row.LicenseExpiryDate.Valid {
			expiry := row.LicenseExpiryDate.Time.Format("2006-01-02")
			msg := fmt.Sprintf("Prawo jazdy kierowcy (ID %d) wygasa %s", row.DriverID, expiry)
			id, err := s.queries.CreateAlert(ctx, sqlc.CreateAlertParams{
				VehicleID: vehicleIDNull,
				AlertType: "driver_license_expiry",
				Message:   sql.NullString{String: msg, Valid: true},
			})
			if err != nil {
				return nil, err
			}
			alerts = append(alerts, ExpiringAlert{AlertID: id, DriverID: row.DriverID, AlertType: "driver_license_expiry", Message: msg})
		}

		if row.AdrCertified && row.AdrExpiryDate.Valid {
			expiry := row.AdrExpiryDate.Time.Format("2006-01-02")
			msg := fmt.Sprintf("Certyfikat ADR kierowcy (ID %d) wygasa %s", row.DriverID, expiry)
			id, err := s.queries.CreateAlert(ctx, sqlc.CreateAlertParams{
				VehicleID: vehicleIDNull,
				AlertType: "driver_adr_expiry",
				Message:   sql.NullString{String: msg, Valid: true},
			})
			if err != nil {
				return nil, err
			}
			alerts = append(alerts, ExpiringAlert{AlertID: id, DriverID: row.DriverID, AlertType: "driver_adr_expiry", Message: msg})
		}
	}

	return alerts, nil
}
