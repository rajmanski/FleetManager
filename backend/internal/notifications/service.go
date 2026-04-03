package notifications

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	sqlc "fleet-management/internal/db/sqlc"
)

var (
	ErrInvalidUserID             = errors.New("invalid user id")
	ErrInvalidNotificationType  = errors.New("invalid notification type")
)

type Service struct {
	queries *sqlc.Queries
}

func NewService(queries *sqlc.Queries) *Service {
	return &Service{queries: queries}
}

func (s *Service) createNotification(ctx context.Context, userID int32, notifType string, message string) (int64, error) {
	if userID <= 0 {
		return 0, ErrInvalidUserID
	}

	t := strings.TrimSpace(notifType)
	if t == "" {
		return 0, ErrInvalidNotificationType
	}

	var dbType sqlc.NotificationsType
	switch t {
	case string(sqlc.NotificationsTypeInsuranceExpiry):
		dbType = sqlc.NotificationsTypeInsuranceExpiry
	case string(sqlc.NotificationsTypeInspectionDue):
		dbType = sqlc.NotificationsTypeInspectionDue
	case string(sqlc.NotificationsTypeCertificateExpiry):
		dbType = sqlc.NotificationsTypeCertificateExpiry
	case string(sqlc.NotificationsTypeFuelAnomaly):
		dbType = sqlc.NotificationsTypeFuelAnomaly
	default:
		return 0, ErrInvalidNotificationType
	}

	rawMsg := strings.TrimSpace(message)
	msg := sql.NullString{String: rawMsg, Valid: rawMsg != ""}

	return s.queries.CreateNotification(ctx, sqlc.CreateNotificationParams{
		UserID:  userID,
		Type:    dbType,
		Message: msg,
	})
}

func (s *Service) CreateNotification(ctx context.Context, userID int32, notifType string, message string) (int64, error) {
	return s.createNotification(ctx, userID, notifType, message)
}

