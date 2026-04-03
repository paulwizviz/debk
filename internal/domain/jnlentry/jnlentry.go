package jnlentry

import (
	"time"

	"debk/internal/domain/acct"
)

const (
	TblEntry          = "journal_entry"
	ColEntryID        = "id"
	ColEntryDate      = "entry_date"
	ColEntryDesc      = "description"
	ColEntryRef       = "reference"
	ColEntryIsClosing = "is_closing"

	TblLine        = "journal_line"
	ColLineID      = "id"
	ColLineEntryID = "journal_entry_id"
	ColLineAcctID  = "account_id"
	ColLineAmount  = "amount"
	ColLineSide    = "side"
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

// Detail represents a financial journal entry.
type Detail struct {
	ID          int
	EntryDate   time.Time
	Description string
	Reference   string
	IsClosing   bool
	Lines       []Line
}

// Line represents a single debit or credit line within a journal entry.
type Line struct {
	ID        int
	EntryID   int
	AccountID int
	Amount    float64
	Side      string // "Debit" or "Credit"
}
