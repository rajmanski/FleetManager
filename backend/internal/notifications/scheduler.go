package notifications

import (
	"context"
	"log"
	"time"

	"github.com/robfig/cron/v3"

	sqlc "fleet-management/internal/db/sqlc"
)

func StartTermScheduler(svc *Service, cronExpr string, lookaheadDays int) {
	if svc == nil {
		return
	}
	la := int64(lookaheadDays)
	if la <= 0 {
		la = 30
	}

	c := cron.New()
	_, err := c.AddFunc(cronExpr, func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()
		if err := svc.RunDueTermNotifications(ctx, la); err != nil {
			log.Printf("notification scheduler: run failed: %v", err)
		}
	})
	if err != nil {
		log.Printf("notification scheduler: invalid cron %q: %v", cronExpr, err)
		return
	}
	c.Start()
	log.Printf("notification scheduler: started (cron=%q lookahead_days=%d)", cronExpr, la)
}

func (s *Service) RunDueTermNotifications(ctx context.Context, lookaheadDays int64) error {
	if lookaheadDays <= 0 {
		lookaheadDays = 30
	}

	mechanics, err := s.queries.ListMechanicUserIDs(ctx)
	if err != nil {
		return err
	}
	if len(mechanics) == 0 {
		return nil
	}

	insurance, err := s.queries.ListSchedulerInsuranceNotifications(ctx, lookaheadDays)
	if err != nil {
		return err
	}
	inspections, err := s.queries.ListSchedulerInspectionNotifications(ctx, lookaheadDays)
	if err != nil {
		return err
	}
	licenseCerts, err := s.queries.ListSchedulerDriverLicenseExpiryNotifications(ctx, lookaheadDays)
	if err != nil {
		return err
	}
	adrCerts, err := s.queries.ListSchedulerDriverAdrExpiryNotifications(ctx, lookaheadDays)
	if err != nil {
		return err
	}

	insType := string(sqlc.NotificationsTypeInsuranceExpiry)
	inspType := string(sqlc.NotificationsTypeInspectionDue)
	certType := string(sqlc.NotificationsTypeCertificateExpiry)

	var created int
	for _, uid := range mechanics {
		for _, msg := range insurance {
			if _, err := s.CreateNotification(ctx, uid, insType, msg); err != nil {
				return err
			}
			created++
		}
		for _, msg := range inspections {
			if _, err := s.CreateNotification(ctx, uid, inspType, msg); err != nil {
				return err
			}
			created++
		}
		for _, msg := range licenseCerts {
			if _, err := s.CreateNotification(ctx, uid, certType, msg); err != nil {
				return err
			}
			created++
		}
		for _, msg := range adrCerts {
			if _, err := s.CreateNotification(ctx, uid, certType, msg); err != nil {
				return err
			}
			created++
		}
	}

	log.Printf(
		"notification scheduler: mechanics=%d insurance=%d inspections=%d license_certs=%d adr_certs=%d notifications_created=%d",
		len(mechanics),
		len(insurance),
		len(inspections),
		len(licenseCerts),
		len(adrCerts),
		created,
	)
	return nil
}
