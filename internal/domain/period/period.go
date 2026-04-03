package period

import "time"

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
