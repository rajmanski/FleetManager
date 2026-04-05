package notifications

import (
	"context"
	"log"

	sqlc "fleet-management/internal/db/sqlc"
)

func (s *Service) fanOutMechanicNotifications(
	ctx context.Context,
	mechanics []int32,
	notifType string,
	messages []string,
) (created int, err error) {
	for _, uid := range mechanics {
		for _, msg := range messages {
			if _, err := s.CreateNotification(ctx, uid, notifType, msg); err != nil {
				return created, err
			}
			created++
		}
	}
	return created, nil
}

func (s *Service) CheckExpiringInsurance(ctx context.Context, lookaheadDays int64) error {
	if lookaheadDays <= 0 {
		lookaheadDays = 30
	}
	mechanics, err := s.queries.ListMechanicUserIDs(ctx)
	if err != nil {
		log.Printf("scheduler job CheckExpiringInsurance: list mechanics error: %v", err)
		return err
	}
	if len(mechanics) == 0 {
		log.Printf("scheduler job CheckExpiringInsurance: no mechanics, skipping")
		return nil
	}
	msgs, err := s.queries.ListSchedulerInsuranceNotifications(ctx, lookaheadDays)
	if err != nil {
		log.Printf("scheduler job CheckExpiringInsurance: query error: %v", err)
		return err
	}
	insType := string(sqlc.NotificationsTypeInsuranceExpiry)
	created, err := s.fanOutMechanicNotifications(ctx, mechanics, insType, msgs)
	if err != nil {
		log.Printf("scheduler job CheckExpiringInsurance: create notifications error: %v", err)
		return err
	}
	log.Printf(
		"scheduler job CheckExpiringInsurance: checked_policies=%d mechanics=%d created_notifications=%d",
		len(msgs),
		len(mechanics),
		created,
	)
	return nil
}

func (s *Service) CheckExpiringCertificates(ctx context.Context, lookaheadDays int64) error {
	if lookaheadDays <= 0 {
		lookaheadDays = 30
	}
	mechanics, err := s.queries.ListMechanicUserIDs(ctx)
	if err != nil {
		log.Printf("scheduler job CheckExpiringCertificates: list mechanics error: %v", err)
		return err
	}
	if len(mechanics) == 0 {
		log.Printf("scheduler job CheckExpiringCertificates: no mechanics, skipping")
		return nil
	}
	licenseMsgs, err := s.queries.ListSchedulerDriverLicenseExpiryNotifications(ctx, lookaheadDays)
	if err != nil {
		log.Printf("scheduler job CheckExpiringCertificates: license query error: %v", err)
		return err
	}
	adrMsgs, err := s.queries.ListSchedulerDriverAdrExpiryNotifications(ctx, lookaheadDays)
	if err != nil {
		log.Printf("scheduler job CheckExpiringCertificates: ADR query error: %v", err)
		return err
	}
	certType := string(sqlc.NotificationsTypeCertificateExpiry)
	var created int
	c1, err := s.fanOutMechanicNotifications(ctx, mechanics, certType, licenseMsgs)
	if err != nil {
		log.Printf("scheduler job CheckExpiringCertificates: create (license) error: %v", err)
		return err
	}
	created += c1
	c2, err := s.fanOutMechanicNotifications(ctx, mechanics, certType, adrMsgs)
	if err != nil {
		log.Printf("scheduler job CheckExpiringCertificates: create (ADR) error: %v", err)
		return err
	}
	created += c2
	checked := len(licenseMsgs) + len(adrMsgs)
	log.Printf(
		"scheduler job CheckExpiringCertificates: checked_driver_cert_rows=%d (license=%d adr=%d) mechanics=%d created_notifications=%d",
		checked,
		len(licenseMsgs),
		len(adrMsgs),
		len(mechanics),
		created,
	)
	return nil
}

func (s *Service) CheckMaintenanceDue(ctx context.Context, lookaheadDays int64) error {
	if lookaheadDays <= 0 {
		lookaheadDays = 30
	}
	mechanics, err := s.queries.ListMechanicUserIDs(ctx)
	if err != nil {
		log.Printf("scheduler job CheckMaintenanceDue: list mechanics error: %v", err)
		return err
	}
	if len(mechanics) == 0 {
		log.Printf("scheduler job CheckMaintenanceDue: no mechanics, skipping")
		return nil
	}
	inspectionMsgs, err := s.queries.ListSchedulerInspectionNotifications(ctx, lookaheadDays)
	if err != nil {
		log.Printf("scheduler job CheckMaintenanceDue: inspection query error: %v", err)
		return err
	}
	maintenanceMsgs, err := s.queries.ListSchedulerMaintenanceDueNotifications(ctx, lookaheadDays)
	if err != nil {
		log.Printf("scheduler job CheckMaintenanceDue: maintenance query error: %v", err)
		return err
	}
	inspType := string(sqlc.NotificationsTypeInspectionDue)
	maintType := string(sqlc.NotificationsTypeMaintenanceDue)
	var created int
	c1, err := s.fanOutMechanicNotifications(ctx, mechanics, inspType, inspectionMsgs)
	if err != nil {
		log.Printf("scheduler job CheckMaintenanceDue: create (inspection) error: %v", err)
		return err
	}
	created += c1
	c2, err := s.fanOutMechanicNotifications(ctx, mechanics, maintType, maintenanceMsgs)
	if err != nil {
		log.Printf("scheduler job CheckMaintenanceDue: create (maintenance) error: %v", err)
		return err
	}
	created += c2
	log.Printf(
		"scheduler job CheckMaintenanceDue: checked_inspections=%d checked_scheduled_maintenance=%d mechanics=%d created_notifications=%d",
		len(inspectionMsgs),
		len(maintenanceMsgs),
		len(mechanics),
		created,
	)
	return nil
}

func (s *Service) RunDueTermNotifications(ctx context.Context, lookaheadDays int64) error {
	if lookaheadDays <= 0 {
		lookaheadDays = 30
	}
	if err := s.CheckExpiringInsurance(ctx, lookaheadDays); err != nil {
		return err
	}
	if err := s.CheckExpiringCertificates(ctx, lookaheadDays); err != nil {
		return err
	}
	if err := s.CheckMaintenanceDue(ctx, lookaheadDays); err != nil {
		return err
	}
	return nil
}
