package notifications

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	sqlc "fleet-management/internal/db/sqlc"
)

const maxNotificationsListLimit int32 = 100

var (
	ErrInvalidUserID           = errors.New("invalid user id")
	ErrInvalidNotificationType = errors.New("invalid notification type")
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

	var dbType sqlc.NotificationType
	switch t {
	case string(sqlc.NotificationTypeInsuranceExpiry):
		dbType = sqlc.NotificationTypeInsuranceExpiry
	case string(sqlc.NotificationTypeInspectionDue):
		dbType = sqlc.NotificationTypeInspectionDue
	case string(sqlc.NotificationTypeCertificateExpiry):
		dbType = sqlc.NotificationTypeCertificateExpiry
	case string(sqlc.NotificationTypeFuelAnomaly):
		dbType = sqlc.NotificationTypeFuelAnomaly
	case string(sqlc.NotificationTypeMaintenanceDue):
		dbType = sqlc.NotificationTypeMaintenanceDue
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

func (s *Service) ListForUser(ctx context.Context, userID int32) ([]sqlc.Notification, error) {
	if userID <= 0 {
		return nil, ErrInvalidUserID
	}
	rows, err := s.queries.ListNotificationForUser(ctx, sqlc.ListNotificationForUserParams{
		UserID: userID,
		Limit:  maxNotificationsListLimit,
	})
	if err != nil {
		return nil, err
	}
	out := make([]sqlc.Notification, 0, len(rows))
	for _, r := range rows {
		out = append(out, sqlc.Notification{
			ID:        r.ID,
			UserID:    r.UserID,
			Type:      r.Type,
			Message:   r.Message,
			IsRead:    r.IsRead,
			CreatedAt: r.CreatedAt,
		})
	}
	return out, nil
}

func (s *Service) MarkAsReadForUser(ctx context.Context, userID int32, notificationID int32) error {
	if userID <= 0 || notificationID <= 0 {
		return ErrInvalidUserID
	}
	n, err := s.queries.MarkNotificationReadForUser(ctx, sqlc.MarkNotificationReadForUserParams{
		ID:     notificationID,
		UserID: userID,
	})
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotificationNotFound
	}
	return nil
}

