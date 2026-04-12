package period

import (
	"context"
	"time"
)

const (
	TblPeriod         = "period"
	ColPeriodID       = "id"
	ColPeriodBusiness = "business_id"
	ColPeriodStart    = "start_date"
	ColPeriodEnd      = "end_date"
	ColPeriodLabel    = "label"
	ColPeriodIsClosed = "is_closed"
)

var (
	CreatePeriodTableSQL = `CREATE TABLE IF NOT EXISTS ` + TblPeriod + ` (
		` + ColPeriodID + ` INTEGER PRIMARY KEY,
		` + ColPeriodStart + ` TEXT NOT NULL,
		` + ColPeriodEnd + ` TEXT NOT NULL,
		` + ColPeriodIsClosed + ` BOOLEAN NOT NULL
	)`
)

// Detail is an accounting period.
type Detail struct {
	ID         int       `json:"id"`
	BusinessID int       `json:"business_id"`
	Label      string    `json:"label"`
	Start      time.Time `json:"start"`
	End        time.Time `json:"end"`
	IsClosed   bool      `json:"is_closed"`
}

// Repository persists periods.
type Repository interface {
	Create(ctx context.Context, period *Detail) error
	GetByID(ctx context.Context, id int) (*Detail, error)
	ListForBusiness(ctx context.Context, businessID int) ([]Detail, error)
	Update(ctx context.Context, period *Detail) error
}

// Service manages periods.
type Service interface {
	OpenPeriod(ctx context.Context, businessID int, label string, start, end time.Time) (*Detail, error)
	ClosePeriod(ctx context.Context, id int) error
	ListPeriods(ctx context.Context, businessID int) ([]Detail, error)
	GetPeriod(ctx context.Context, id int) (*Detail, error)
}
