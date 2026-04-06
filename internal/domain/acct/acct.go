package acct

import "context"

const (
	TblAcct     = "account"
	ColAcctID   = "id"
	ColAcctCode = "code"
	ColAcctName = "name"
	ColAcctType = "type"
	ColIsTemp   = "is_temp"
	ColIsContra = "is_contra"

	// Account types
	Asset     = "Asset"
	Liability = "Liability"
	Equity    = "Equity"
	Revenue   = "Revenue"
	Expense   = "Expense"
)

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

// Detail represents the details of an account, including its ID, code, name, type, and whether it is temporary or a contra account.
type Detail struct {
	ID       int
	Code     string
	Name     string
	Type     string
	IsTemp   bool
	IsContra bool
}

// Repository defines the interface for persisting and retrieving accounts.
type Repository interface {
	Create(ctx context.Context, account *Detail) error
	GetByID(ctx context.Context, id int) (*Detail, error)
	GetByCode(ctx context.Context, code string) (*Detail, error)
	List(ctx context.Context) ([]Detail, error)
	Update(ctx context.Context, account *Detail) error
	Delete(ctx context.Context, id int) error
}

// Service defines the business logic for managing accounts.
type Service interface {
	CreateAccount(ctx context.Context, account *Detail) error
	GetAccount(ctx context.Context, id int) (*Detail, error)
	ListAccounts(ctx context.Context) ([]Detail, error)
}
