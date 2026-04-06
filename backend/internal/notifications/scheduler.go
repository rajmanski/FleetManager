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
	lookaheadDays = clampLookaheadDays(lookaheadDays)
	mechanics, skip, err := s.listMechanicsForJob(ctx, "CheckExpiringInsurance")
	if err != nil {
		return err
	}
	if skip {
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
	lookaheadDays = clampLookaheadDays(lookaheadDays)
	mechanics, skip, err := s.listMechanicsForJob(ctx, "CheckExpiringCertificates")
	if err != nil {
		return err
	}
	if skip {
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
	created, err := s.fanOutMechanicBatches(ctx, mechanics, []fanOutBatch{
		{notifType: certType, messages: licenseMsgs},
		{notifType: certType, messages: adrMsgs},
	})
	if err != nil {
		log.Printf("scheduler job CheckExpiringCertificates: create notifications error: %v", err)
		return err
	}
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
	lookaheadDays = clampLookaheadDays(lookaheadDays)
	mechanics, skip, err := s.listMechanicsForJob(ctx, "CheckMaintenanceDue")
	if err != nil {
		return err
	}
	if skip {
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
	created, err := s.fanOutMechanicBatches(ctx, mechanics, []fanOutBatch{
		{notifType: inspType, messages: inspectionMsgs},
		{notifType: maintType, messages: maintenanceMsgs},
	})
	if err != nil {
		log.Printf("scheduler job CheckMaintenanceDue: create notifications error: %v", err)
		return err
	}
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
	lookaheadDays = clampLookaheadDays(lookaheadDays)
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
