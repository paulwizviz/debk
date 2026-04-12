package period

import (
	"context"
	"fmt"
	"time"
)

type service struct {
	repo Repository
}

// NewService creates a period service.
func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) OpenPeriod(ctx context.Context, businessID int, label string, start, end time.Time) (*Detail, error) {
	if start.After(end) {
		return nil, fmt.Errorf("start date must be before end date")
	}
	if businessID == 0 {
		businessID = 1
	}

	p := &Detail{
		BusinessID: businessID,
		Label:      label,
		Start:      start,
		End:        end,
		IsClosed:   false,
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

func (s *service) ListPeriods(ctx context.Context, businessID int) ([]Detail, error) {
	if businessID == 0 {
		businessID = 1
	}
	return s.repo.ListForBusiness(ctx, businessID)
}

func (s *service) GetPeriod(ctx context.Context, id int) (*Detail, error) {
	return s.repo.GetByID(ctx, id)
}
