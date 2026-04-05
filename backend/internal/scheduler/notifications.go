package scheduler

import (
	"context"
	"log"
	"time"

	"fleet-management/internal/notifications"
)

func RegisterDueTermNotifications(s *Scheduler, svc *notifications.Service, cronExpr string, lookaheadDays int) error {
	if s == nil || svc == nil {
		return nil
	}
	la := lookaheadDays
	if la <= 0 {
		la = 30
	}
	lookahead := int64(la)
	return s.AddFunc(cronExpr, func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()
		if err := svc.RunDueTermNotifications(ctx, lookahead); err != nil {
			log.Printf("notification scheduler: run failed: %v", err)
		}
	})
}
