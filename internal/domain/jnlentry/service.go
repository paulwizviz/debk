package jnlentry

import (
	"context"
	"fmt"
	"math"
)

type service struct {
	repo Repository
}

// NewService creates a new journal entry service.
func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) PostEntry(ctx context.Context, entry *Detail) error {
	if len(entry.Lines) < 2 {
		return fmt.Errorf("journal entry must have at least two lines")
	}

	var balance float64
	for _, line := range entry.Lines {
		if line.Side == Debit {
			balance += line.Amount
		} else if line.Side == Credit {
			balance -= line.Amount
		} else {
			return fmt.Errorf("invalid side: %s", line.Side)
		}
	}

	// Use a small epsilon for floating point comparison
	if math.Abs(balance) > 0.000001 {
		return fmt.Errorf("transaction must balance (current balance: %f)", balance)
	}

	return s.repo.Create(ctx, entry)
}

func (s *service) GetEntry(ctx context.Context, id int) (*Detail, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) ListEntries(ctx context.Context) ([]Detail, error) {
	return s.repo.List(ctx)
}
