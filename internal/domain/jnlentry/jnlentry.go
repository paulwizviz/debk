package jnlentry

import (
	"context"
	"time"

	"debk/internal/domain/acct"
	"debk/internal/domain/period"
)

const (
	TblEntry           = "journal_entry"
	ColEntryID         = "id"
	ColEntryBusiness   = "business_id"
	ColEntryPeriod     = "period_id"
	ColEntrySeq        = "journal_seq"
	ColEntryDate       = "entry_date"
	ColEntryDesc       = "description"
	ColEntryRef        = "reference"
	ColEntryKind       = "entry_kind"
	ColEntryCreated    = "created_at"
	ColEntryPosted     = "posted_at"
	ColEntryIsClosing  = "is_closing"

	TblLine        = "journal_line"
	ColLineID      = "id"
	ColLineEntryID = "journal_entry_id"
	ColLineAcctID  = "account_id"
	ColLineAmount  = "amount"
	ColLineSide    = "side"

	Debit  = "Debit"
	Credit = "Credit"

	EntryKindNormal    = "normal"
	EntryKindAdjusting = "adjusting"
	EntryKindClosing   = "closing"
)

var (
	CreateEntryTableSQL = `CREATE TABLE IF NOT EXISTS ` + TblEntry + ` (
		` + ColEntryID + ` INTEGER PRIMARY KEY,
		` + ColEntryDate + ` TEXT NOT NULL,
		` + ColEntryDesc + ` TEXT NOT NULL,
		` + ColEntryRef + ` TEXT,
		` + ColEntryIsClosing + ` BOOLEAN NOT NULL
	)`

	CreateLineTableSQL = `CREATE TABLE IF NOT EXISTS ` + TblLine + ` (
		` + ColLineID + ` INTEGER PRIMARY KEY,
		` + ColLineEntryID + ` INTEGER NOT NULL,
		` + ColLineAcctID + ` INTEGER NOT NULL,
		` + ColLineAmount + ` REAL NOT NULL,
		` + ColLineSide + ` TEXT NOT NULL,
		FOREIGN KEY(` + ColLineEntryID + `) REFERENCES ` + TblEntry + `(` + ColEntryID + `),
		FOREIGN KEY(` + ColLineAcctID + `) REFERENCES ` + acct.TblAcct + `(` + acct.ColAcctID + `)
	)`
)

// Detail is a posted journal entry (immutable once stored).
type Detail struct {
	ID          int       `json:"id"`
	BusinessID  int       `json:"business_id"`
	PeriodID    int       `json:"period_id"`
	JournalSeq  int       `json:"journal_seq"`
	EntryDate   time.Time `json:"entry_date"`
	Description string    `json:"description"`
	Reference   string    `json:"reference"`
	EntryKind   string    `json:"entry_kind"`
	CreatedAt   time.Time `json:"created_at"`
	PostedAt    time.Time `json:"posted_at"`
	IsClosing   bool      `json:"is_closing"`
	Lines       []Line    `json:"lines"`
}

// Line is one debit or credit line.
type Line struct {
	ID        int     `json:"id"`
	EntryID   int     `json:"entry_id"`
	AccountID int     `json:"account_id"`
	Amount    float64 `json:"amount"`
	Side      string  `json:"side"`
}

// Repository persists journal entries.
type Repository interface {
	Create(ctx context.Context, entry *Detail) error
	GetByID(ctx context.Context, id int) (*Detail, error)
	List(ctx context.Context, businessID int) ([]Detail, error)
}

// Service posts and reads journal entries.
type Service interface {
	PostEntry(ctx context.Context, entry *Detail) error
	GetEntry(ctx context.Context, id int) (*Detail, error)
	ListEntries(ctx context.Context, businessID int) ([]Detail, error)
}

// AccountReader loads accounts for posting validation.
type AccountReader interface {
	GetByID(ctx context.Context, id int) (*acct.Detail, error)
}

// PeriodReader loads periods for posting validation.
type PeriodReader interface {
	GetByID(ctx context.Context, id int) (*period.Detail, error)
}
