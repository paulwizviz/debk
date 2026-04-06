package period

import (
	"context"
	"fmt"
	"time"
)

type service struct {
	repo Repository
}

// NewService creates a new period service.
func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) OpenPeriod(ctx context.Context, start, end time.Time) (*Detail, error) {
	if start.After(end) {
		return nil, fmt.Errorf("start date must be before end date")
	}

	p := &Detail{
		Start:    start,
		End:      end,
		IsClosed: false,
	}

	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}

	return p, nil
}

func (s *service) ClosePeriod(ctx context.Context, id int) error {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if p.IsClosed {
		return fmt.Errorf("period is already closed")
	}

	p.IsClosed = true
	return s.repo.Update(ctx, p)
}

func (s *service) ListPeriods(ctx context.Context) ([]Detail, error) {
	return s.repo.List(ctx)
}
