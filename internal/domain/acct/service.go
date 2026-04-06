package acct

import (
	"context"
	"fmt"
)

type service struct {
	repo Repository
}

// NewService creates a new account service.
func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) CreateAccount(ctx context.Context, account *Detail) error {
	if account.Code == "" {
		return fmt.Errorf("account code is required")
	}
	if account.Name == "" {
		return fmt.Errorf("account name is required")
	}
	if account.Type == "" {
		return fmt.Errorf("account type is required")
	}

	// Check if account with same code already exists
	existing, err := s.repo.GetByCode(ctx, account.Code)
	if err == nil && existing != nil {
		return fmt.Errorf("account with code %s already exists", account.Code)
	}

	return s.repo.Create(ctx, account)
}

func (s *service) GetAccount(ctx context.Context, id int) (*Detail, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) ListAccounts(ctx context.Context) ([]Detail, error) {
	return s.repo.List(ctx)
}
