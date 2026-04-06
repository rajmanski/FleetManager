package notifications

import (
	"context"
	"log"
)

const defaultSchedulerLookaheadDays int64 = 30

func clampLookaheadDays(d int64) int64 {
	if d <= 0 {
		return defaultSchedulerLookaheadDays
	}
	return d
}

// listMechanicsForJob returns mechanic user IDs, or skip=true when there is nobody to notify.
func (s *Service) listMechanicsForJob(ctx context.Context, job string) (mechanics []int32, skip bool, err error) {
	mechanics, err = s.queries.ListMechanicUserIDs(ctx)
	if err != nil {
		log.Printf("scheduler job %s: list mechanics error: %v", job, err)
		return nil, false, err
	}
	if len(mechanics) == 0 {
		log.Printf("scheduler job %s: no mechanics, skipping", job)
		return nil, true, nil
	}
	return mechanics, false, nil
}
