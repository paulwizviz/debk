package jnlentry

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type repo struct {
	db *sql.DB
}

// NewRepository creates a journal entry repository.
func NewRepository(db *sql.DB) Repository {
	return &repo{db: db}
}

func (r *repo) nextJournalSeq(ctx context.Context, tx *sql.Tx, businessID int) (int, error) {
	var m sql.NullInt64
	err := tx.QueryRowContext(ctx,
		fmt.Sprintf(`SELECT MAX(%s) FROM %s WHERE %s = ?`, ColEntrySeq, TblEntry, ColEntryBusiness),
		businessID).Scan(&m)
	if err != nil {
		return 0, fmt.Errorf("next journal seq: %w", err)
	}
	if !m.Valid {
		return 1, nil
	}
	return int(m.Int64) + 1, nil
}

func (r *repo) Create(ctx context.Context, entry *Detail) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("beginning transaction: %w", err)
	}
	defer tx.Rollback()

	seq, err := r.nextJournalSeq(ctx, tx, entry.BusinessID)
	if err != nil {
		return err
	}
	entry.JournalSeq = seq

	var periodID any
	if entry.PeriodID == 0 {
		periodID = nil
	} else {
		periodID = entry.PeriodID
	}

	entryQuery := fmt.Sprintf(`INSERT INTO %s (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		TblEntry,
		ColEntryDate, ColEntryDesc, ColEntryRef, ColEntryIsClosing,
		ColEntryBusiness, ColEntryPeriod, ColEntrySeq, ColEntryCreated, ColEntryPosted, ColEntryKind)
	res, err := tx.ExecContext(ctx, entryQuery,
		entry.EntryDate.Format(time.RFC3339),
		entry.Description,
		nullString(entry.Reference),
		entry.IsClosing,
		entry.BusinessID,
		periodID,
		entry.JournalSeq,
		entry.CreatedAt.Format(time.RFC3339Nano),
		entry.PostedAt.Format(time.RFC3339Nano),
		entry.EntryKind,
	)
	if err != nil {
		return fmt.Errorf("inserting journal entry: %w", err)
	}

	entryID, err := res.LastInsertId()
	if err != nil {
		return fmt.Errorf("getting last insert id: %w", err)
	}
	entry.ID = int(entryID)

	lineQuery := fmt.Sprintf("INSERT INTO %s (%s, %s, %s, %s) VALUES (?, ?, ?, ?)",
		TblLine, ColLineEntryID, ColLineAcctID, ColLineAmount, ColLineSide)
	for i := range entry.Lines {
		entry.Lines[i].EntryID = entry.ID
		res, err := tx.ExecContext(ctx, lineQuery, entry.Lines[i].EntryID, entry.Lines[i].AccountID, entry.Lines[i].Amount, entry.Lines[i].Side)
		if err != nil {
			return fmt.Errorf("inserting journal line: %w", err)
		}
		lineID, err := res.LastInsertId()
		if err != nil {
			return fmt.Errorf("getting line last insert id: %w", err)
		}
		entry.Lines[i].ID = int(lineID)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("committing transaction: %w", err)
	}

	return nil
}

func nullString(s string) any {
	if s == "" {
		return nil
	}
	return s
}

func parseTimeFlexible(s string) (time.Time, error) {
	if s == "" {
		return time.Time{}, fmt.Errorf("empty time")
	}
	t, err := time.Parse(time.RFC3339Nano, s)
	if err == nil {
		return t, nil
	}
	return time.Parse(time.RFC3339, s)
}

func (r *repo) scanEntry(row *sql.Row) (*Detail, error) {
	var entry Detail
	var entryDateStr, createdStr, postedStr string
	var period sql.NullInt64
	err := row.Scan(
		&entry.ID,
		&entry.BusinessID,
		&period,
		&entry.JournalSeq,
		&entryDateStr,
		&entry.Description,
		&entry.Reference,
		&entry.EntryKind,
		&createdStr,
		&postedStr,
		&entry.IsClosing,
	)
	if err != nil {
		return nil, err
	}
	if period.Valid {
		entry.PeriodID = int(period.Int64)
	}
	entry.EntryDate, err = time.Parse(time.RFC3339, entryDateStr)
	if err != nil {
		return nil, fmt.Errorf("parsing entry date: %w", err)
	}
	entry.CreatedAt, err = parseTimeFlexible(createdStr)
	if err != nil {
		return nil, fmt.Errorf("parsing created_at: %w", err)
	}
	entry.PostedAt, err = parseTimeFlexible(postedStr)
	if err != nil {
		return nil, fmt.Errorf("parsing posted_at: %w", err)
	}
	return &entry, nil
}

func (r *repo) GetByID(ctx context.Context, id int) (*Detail, error) {
	entryQuery := fmt.Sprintf(`SELECT %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s FROM %s WHERE %s = ?`,
		ColEntryID, ColEntryBusiness, ColEntryPeriod, ColEntrySeq,
		ColEntryDate, ColEntryDesc, ColEntryRef, ColEntryKind, ColEntryCreated, ColEntryPosted, ColEntryIsClosing,
		TblEntry, ColEntryID)
	row := r.db.QueryRowContext(ctx, entryQuery, id)

	entry, err := r.scanEntry(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("journal entry not found: %d", id)
		}
		return nil, fmt.Errorf("scanning journal entry: %w", err)
	}

	lineQuery := fmt.Sprintf(`SELECT %s, %s, %s, %s, %s FROM %s WHERE %s = ?`,
		ColLineID, ColLineEntryID, ColLineAcctID, ColLineAmount, ColLineSide, TblLine, ColLineEntryID)
	rows, err := r.db.QueryContext(ctx, lineQuery, id)
	if err != nil {
		return nil, fmt.Errorf("querying journal lines: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var line Line
		if err := rows.Scan(&line.ID, &line.EntryID, &line.AccountID, &line.Amount, &line.Side); err != nil {
			return nil, fmt.Errorf("scanning journal line: %w", err)
		}
		entry.Lines = append(entry.Lines, line)
	}

	return entry, nil
}

func (r *repo) List(ctx context.Context, businessID int) ([]Detail, error) {
	var (
		rows *sql.Rows
		err  error
	)
	if businessID <= 0 {
		q := fmt.Sprintf(`SELECT %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s FROM %s ORDER BY %s DESC, %s DESC`,
			ColEntryID, ColEntryBusiness, ColEntryPeriod, ColEntrySeq,
			ColEntryDate, ColEntryDesc, ColEntryRef, ColEntryKind, ColEntryCreated, ColEntryPosted, ColEntryIsClosing,
			TblEntry, ColEntrySeq, ColEntryID)
		rows, err = r.db.QueryContext(ctx, q)
	} else {
		q := fmt.Sprintf(`SELECT %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s FROM %s WHERE %s = ? ORDER BY %s DESC, %s DESC`,
			ColEntryID, ColEntryBusiness, ColEntryPeriod, ColEntrySeq,
			ColEntryDate, ColEntryDesc, ColEntryRef, ColEntryKind, ColEntryCreated, ColEntryPosted, ColEntryIsClosing,
			TblEntry, ColEntryBusiness, ColEntrySeq, ColEntryID)
		rows, err = r.db.QueryContext(ctx, q, businessID)
	}
	if err != nil {
		return nil, fmt.Errorf("listing journal entries: %w", err)
	}
	defer rows.Close()

	var entries []Detail
	for rows.Next() {
		var entry Detail
		var entryDateStr, createdStr, postedStr string
		var period sql.NullInt64
		if err := rows.Scan(
			&entry.ID, &entry.BusinessID, &period, &entry.JournalSeq,
			&entryDateStr, &entry.Description, &entry.Reference, &entry.EntryKind,
			&createdStr, &postedStr, &entry.IsClosing,
		); err != nil {
			return nil, fmt.Errorf("scanning journal entry: %w", err)
		}
		if period.Valid {
			entry.PeriodID = int(period.Int64)
		}
		entry.EntryDate, err = time.Parse(time.RFC3339, entryDateStr)
		if err != nil {
			return nil, fmt.Errorf("parsing entry date: %w", err)
		}
		entry.CreatedAt, err = parseTimeFlexible(createdStr)
		if err != nil {
			return nil, fmt.Errorf("parsing created_at: %w", err)
		}
		entry.PostedAt, err = parseTimeFlexible(postedStr)
		if err != nil {
			return nil, fmt.Errorf("parsing posted_at: %w", err)
		}
		entries = append(entries, entry)
	}

	for i := range entries {
		lineQuery := fmt.Sprintf(`SELECT %s, %s, %s, %s, %s FROM %s WHERE %s = ?`,
			ColLineID, ColLineEntryID, ColLineAcctID, ColLineAmount, ColLineSide, TblLine, ColLineEntryID)
		lineRows, err := r.db.QueryContext(ctx, lineQuery, entries[i].ID)
		if err != nil {
			return nil, fmt.Errorf("querying journal lines for entry %d: %w", entries[i].ID, err)
		}
		for lineRows.Next() {
			var line Line
			if err := lineRows.Scan(&line.ID, &line.EntryID, &line.AccountID, &line.Amount, &line.Side); err != nil {
				lineRows.Close()
				return nil, fmt.Errorf("scanning journal line: %w", err)
			}
			entries[i].Lines = append(entries[i].Lines, line)
		}
		lineRows.Close()
	}

	return entries, nil
}
