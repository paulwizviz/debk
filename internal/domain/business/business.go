package business

import "context"

const (
	TblBusiness            = "business"
	ColBusinessID          = "id"
	ColBusinessLegalName   = "legal_name"
	ColBusinessCurrency    = "functional_currency"
	DefaultFunctionalCurr  = "USD"
	DefaultLegalName       = "My Business"
)

var CreateBusinessTableSQL = `CREATE TABLE IF NOT EXISTS ` + TblBusiness + ` (
	` + ColBusinessID + ` INTEGER PRIMARY KEY,
	` + ColBusinessLegalName + ` TEXT NOT NULL,
	` + ColBusinessCurrency + ` TEXT NOT NULL
)`

// Detail is the legal entity whose books are kept.
type Detail struct {
	ID                 int    `json:"id"`
	LegalName          string `json:"legal_name"`
	FunctionalCurrency string `json:"functional_currency"`
}

// Repository persists businesses.
type Repository interface {
	GetByID(ctx context.Context, id int) (*Detail, error)
	List(ctx context.Context) ([]Detail, error)
	Update(ctx context.Context, d *Detail) error
}

// Service is business-level setup and invariants.
type Service interface {
	Get(ctx context.Context, id int) (*Detail, error)
	List(ctx context.Context) ([]Detail, error)
	Update(ctx context.Context, d *Detail) error
}
