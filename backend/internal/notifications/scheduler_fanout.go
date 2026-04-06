package notifications

import (
	"context"
)

// fanOutBatch is one notification type plus message rows from a scheduler query.
type fanOutBatch struct {
	notifType string
	messages  []string
}

func (s *Service) fanOutMechanicBatches(
	ctx context.Context,
	mechanics []int32,
	batches []fanOutBatch,
) (created int, err error) {
	for _, b := range batches {
		c, err := s.fanOutMechanicNotifications(ctx, mechanics, b.notifType, b.messages)
		created += c
		if err != nil {
			return created, err
		}
	}
	return created, nil
}
