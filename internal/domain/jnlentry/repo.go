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

// NewRepository creates a new journal entry repository.
func NewRepository(db *sql.DB) Repository {
	return &repo{db: db}
}

func (r *repo) Create(ctx context.Context, entry *Detail) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("beginning transaction: %w", err)
	}
	defer tx.Rollback()

	entryQuery := fmt.Sprintf("INSERT INTO %s (%s, %s, %s, %s) VALUES (?, ?, ?, ?)",
		TblEntry, ColEntryDate, ColEntryDesc, ColEntryRef, ColEntryIsClosing)
	res, err := tx.ExecContext(ctx, entryQuery, entry.EntryDate.Format(time.RFC3339), entry.Description, entry.Reference, entry.IsClosing)
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

func (r *repo) GetByID(ctx context.Context, id int) (*Detail, error) {
	entryQuery := fmt.Sprintf("SELECT %s, %s, %s, %s, %s FROM %s WHERE %s = ?",
		ColEntryID, ColEntryDate, ColEntryDesc, ColEntryRef, ColEntryIsClosing, TblEntry, ColEntryID)
	row := r.db.QueryRowContext(ctx, entryQuery, id)

	var entry Detail
	var entryDateStr string
	if err := row.Scan(&entry.ID, &entryDateStr, &entry.Description, &entry.Reference, &entry.IsClosing); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("journal entry not found: %d", id)
		}
		return nil, fmt.Errorf("scanning journal entry: %w", err)
	}

	entryDate, err := time.Parse(time.RFC3339, entryDateStr)
	if err != nil {
		return nil, fmt.Errorf("parsing entry date: %w", err)
	}
	entry.EntryDate = entryDate

	lineQuery := fmt.Sprintf("SELECT %s, %s, %s, %s, %s FROM %s WHERE %s = ?",
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

	return &entry, nil
}

func (r *repo) List(ctx context.Context) ([]Detail, error) {
	query := fmt.Sprintf("SELECT %s, %s, %s, %s, %s FROM %s ORDER BY %s DESC",
		ColEntryID, ColEntryDate, ColEntryDesc, ColEntryRef, ColEntryIsClosing, TblEntry, ColEntryDate)
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listing journal entries: %w", err)
	}
	defer rows.Close()

	var entries []Detail
	for rows.Next() {
		var entry Detail
		var entryDateStr string
		if err := rows.Scan(&entry.ID, &entryDateStr, &entry.Description, &entry.Reference, &entry.IsClosing); err != nil {
			return nil, fmt.Errorf("scanning journal entry: %w", err)
		}
		entryDate, err := time.Parse(time.RFC3339, entryDateStr)
		if err != nil {
			return nil, fmt.Errorf("parsing entry date: %w", err)
		}
		entry.EntryDate = entryDate
		entries = append(entries, entry)
	}

	// For each entry, fetch its lines. (Optimisation: could be done in fewer queries)
	for i := range entries {
		lineQuery := fmt.Sprintf("SELECT %s, %s, %s, %s, %s FROM %s WHERE %s = ?",
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

func (r *repo) Delete(ctx context.Context, id int) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("beginning transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete lines first due to foreign key constraint
	lineQuery := fmt.Sprintf("DELETE FROM %s WHERE %s = ?", TblLine, ColLineEntryID)
	if _, err := tx.ExecContext(ctx, lineQuery, id); err != nil {
		return fmt.Errorf("deleting journal lines: %w", err)
	}

	entryQuery := fmt.Sprintf("DELETE FROM %s WHERE %s = ?", TblEntry, ColEntryID)
	if _, err := tx.ExecContext(ctx, entryQuery, id); err != nil {
		return fmt.Errorf("deleting journal entry: %w", err)
	}

	return tx.Commit()
}
