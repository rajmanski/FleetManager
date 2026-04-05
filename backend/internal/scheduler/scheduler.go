package scheduler

import (
	"context"

	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	c *cron.Cron
}

func New() *Scheduler {
	return &Scheduler{c: cron.New()}
}

func (s *Scheduler) AddFunc(spec string, cmd func()) error {
	_, err := s.c.AddFunc(spec, cmd)
	return err
}

func (s *Scheduler) Start() {
	s.c.Start()
}

func (s *Scheduler) Stop() context.Context {
	return s.c.Stop()
}
