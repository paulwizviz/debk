package business

import (
	"context"
	"fmt"
)

type service struct {
	repo Repository
}

// NewService creates a business service.
func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) Get(ctx context.Context, id int) (*Detail, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) List(ctx context.Context) ([]Detail, error) {
	return s.repo.List(ctx)
}

func (s *service) Update(ctx context.Context, d *Detail) error {
	if d.LegalName == "" {
		return fmt.Errorf("legal_name is required")
	}
	if d.FunctionalCurrency == "" {
		return fmt.Errorf("functional_currency is required")
	}
	return s.repo.Update(ctx, d)
}
