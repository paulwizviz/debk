package acct

import (
	"context"
	"errors"
)

const (
	TblAcct          = "account"
	ColAcctID        = "id"
	ColAcctBusiness  = "business_id"
	ColAcctCode      = "code"
	ColAcctName      = "name"
	ColAcctType      = "type"
	ColIsTemp        = "is_temp"
	ColIsContra      = "is_contra"

	RetainedEarningsCode = "3999"
	RetainedEarningsName = "Retained Earnings"

	Asset     = "Asset"
	Liability = "Liability"
	Equity    = "Equity"
	Revenue   = "Revenue"
	Expense   = "Expense"
)

// ErrNotFound is returned when an account does not exist.
var ErrNotFound = errors.New("account not found")

var (
	CreateAcctTableSQL = `CREATE TABLE IF NOT EXISTS ` + TblAcct + ` (
		` + ColAcctID + ` INTEGER PRIMARY KEY,
		` + ColAcctCode + ` TEXT UNIQUE NOT NULL,
		` + ColAcctName + ` TEXT NOT NULL,
		` + ColAcctType + ` TEXT NOT NULL,
		` + ColIsTemp + ` BOOLEAN NOT NULL,
		` + ColIsContra + ` BOOLEAN NOT NULL
	)`
)

// Detail represents a general ledger account.
type Detail struct {
	ID         int    `json:"id"`
	BusinessID int    `json:"business_id"`
	Code       string `json:"code"`
	Name       string `json:"name"`
	Type       string `json:"type"`
	IsTemp     bool   `json:"is_temp"`
	IsContra   bool   `json:"is_contra"`
}

// Repository persists accounts.
type Repository interface {
	Create(ctx context.Context, account *Detail) error
	GetByID(ctx context.Context, id int) (*Detail, error)
	GetByCodeForBusiness(ctx context.Context, businessID int, code string) (*Detail, error)
	ListForBusiness(ctx context.Context, businessID int) ([]Detail, error)
	Update(ctx context.Context, account *Detail) error
	Delete(ctx context.Context, id int) error
}

// Service manages account invariants.
type Service interface {
	CreateAccount(ctx context.Context, account *Detail) error
	GetAccount(ctx context.Context, id int) (*Detail, error)
	ListAccounts(ctx context.Context, businessID int) ([]Detail, error)
	EnsureRetainedEarnings(ctx context.Context, businessID int) error
}
