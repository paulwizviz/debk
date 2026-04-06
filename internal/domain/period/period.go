package period

import (
	"context"
	"time"
)

const (
	TblPeriod         = "period"
	ColPeriodID       = "id"
	ColPeriodStart    = "start_date"
	ColPeriodEnd      = "end_date"
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

// Detail represents an accounting period.
type Detail struct {
	ID       int
	Start    time.Time
	End      time.Time
	IsClosed bool
}

// Repository defines the interface for persisting and retrieving accounting periods.
type Repository interface {
	Create(ctx context.Context, period *Detail) error
	GetByID(ctx context.Context, id int) (*Detail, error)
	List(ctx context.Context) ([]Detail, error)
	Update(ctx context.Context, period *Detail) error
}

// Service defines the business logic for managing accounting periods.
type Service interface {
	OpenPeriod(ctx context.Context, start, end time.Time) (*Detail, error)
	ClosePeriod(ctx context.Context, id int) error
	ListPeriods(ctx context.Context) ([]Detail, error)
}
