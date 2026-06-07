package acct

import (
	"context"
	"errors"
	"fmt"
)

var allowedTypes = map[string]struct{}{
	Asset: {}, Liability: {}, Equity: {}, Revenue: {}, Expense: {},
}

type service struct {
	repo Repository
}

// NewService creates an account service.
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
	if _, ok := allowedTypes[account.Type]; !ok {
		return fmt.Errorf("invalid account type %q (expected Asset, Liability, Equity, Revenue, Expense)", account.Type)
	}
	if account.IsContra && account.Type != Asset {
		return fmt.Errorf("contra accounts must use type Asset (contra-asset)")
	}
	if account.BusinessID == 0 {
		account.BusinessID = 1
	}

	_, err := s.repo.GetByCodeForBusiness(ctx, account.BusinessID, account.Code)
	if err == nil {
		return fmt.Errorf("account with code %s already exists for this business", account.Code)
	}
	if !errors.Is(err, ErrNotFound) {
		return err
	}

	return s.repo.Create(ctx, account)
}

func (s *service) GetAccount(ctx context.Context, id int) (*Detail, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) ListAccounts(ctx context.Context, businessID int) ([]Detail, error) {
	if businessID == 0 {
		businessID = 1
	}
	return s.repo.ListForBusiness(ctx, businessID)
}

func (s *service) CountUserAccounts(ctx context.Context, businessID int) (int, error) {
	if businessID == 0 {
		businessID = 1
	}
	accounts, err := s.repo.ListForBusiness(ctx, businessID)
	if err != nil {
		return 0, err
	}
	n := 0
	for _, a := range accounts {
		if a.Code == RetainedEarningsCode {
			continue
		}
		n++
	}
	return n, nil
}

func (s *service) ApplyTemplate(ctx context.Context, businessID int, key string) ([]Detail, error) {
	if businessID == 0 {
		businessID = 1
	}
	tmpl, ok := FindTemplate(key)
	if !ok {
		return nil, ErrTemplateNotFound
	}
	if err := s.EnsureRetainedEarnings(ctx, businessID); err != nil {
		return nil, fmt.Errorf("ensuring retained earnings: %w", err)
	}
	n, err := s.CountUserAccounts(ctx, businessID)
	if err != nil {
		return nil, err
	}
	if n > 0 {
		return nil, ErrTemplateUnavailable
	}

	created := make([]Detail, 0, len(tmpl.Accounts))
	for _, a := range tmpl.Accounts {
		account := a
		account.BusinessID = businessID
		if err := s.CreateAccount(ctx, &account); err != nil {
			return nil, fmt.Errorf("creating account %s: %w", account.Code, err)
		}
		created = append(created, account)
	}
	return created, nil
}

func (s *service) EnsureRetainedEarnings(ctx context.Context, businessID int) error {
	if businessID == 0 {
		businessID = 1
	}
	_, err := s.repo.GetByCodeForBusiness(ctx, businessID, RetainedEarningsCode)
	if err == nil {
		return nil
	}
	if !errors.Is(err, ErrNotFound) {
		return err
	}
	return s.repo.Create(ctx, &Detail{
		BusinessID: businessID,
		Code:       RetainedEarningsCode,
		Name:       RetainedEarningsName,
		Type:       Equity,
		IsTemp:     false,
		IsContra:   false,
	})
}
