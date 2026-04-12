package dbmigrate

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigrationContext(UpExtendModel, DownExtendModel)
}

// UpExtendModel adds business root, journal metadata, and period/account scoping.
func UpExtendModel(ctx context.Context, tx *sql.Tx) error {
	const createBusiness = `
CREATE TABLE IF NOT EXISTS business (
	id INTEGER PRIMARY KEY,
	legal_name TEXT NOT NULL,
	functional_currency TEXT NOT NULL
);`
	if _, err := tx.ExecContext(ctx, createBusiness); err != nil {
		return fmt.Errorf("create business: %w", err)
	}

	var n int
	if err := tx.QueryRowContext(ctx, `SELECT COUNT(*) FROM business`).Scan(&n); err != nil {
		return fmt.Errorf("count business: %w", err)
	}
	if n == 0 {
		if _, err := tx.ExecContext(ctx, `INSERT INTO business (legal_name, functional_currency) VALUES (?, ?)`,
			"My Business", "USD"); err != nil {
			return fmt.Errorf("seed business: %w", err)
		}
	}

	alters := []string{
		`ALTER TABLE account ADD COLUMN business_id INTEGER NOT NULL DEFAULT 1`,
		`ALTER TABLE period ADD COLUMN business_id INTEGER NOT NULL DEFAULT 1`,
		`ALTER TABLE period ADD COLUMN label TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE journal_entry ADD COLUMN business_id INTEGER NOT NULL DEFAULT 1`,
		`ALTER TABLE journal_entry ADD COLUMN period_id INTEGER`,
		`ALTER TABLE journal_entry ADD COLUMN journal_seq INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE journal_entry ADD COLUMN created_at TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE journal_entry ADD COLUMN posted_at TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE journal_entry ADD COLUMN entry_kind TEXT NOT NULL DEFAULT 'normal'`,
	}
	for _, stmt := range alters {
		if _, err := tx.ExecContext(ctx, stmt); err != nil {
			if !isSQLiteDuplicateColumn(err) {
				return fmt.Errorf("alter: %s: %w", stmt, err)
			}
		}
	}

	if _, err := tx.ExecContext(ctx, `UPDATE journal_entry SET journal_seq = id WHERE journal_seq = 0`); err != nil {
		return fmt.Errorf("backfill journal_seq: %w", err)
	}
	if _, err := tx.ExecContext(ctx, `UPDATE journal_entry SET created_at = entry_date WHERE created_at = '' OR created_at IS NULL`); err != nil {
		return fmt.Errorf("backfill created_at: %w", err)
	}
	if _, err := tx.ExecContext(ctx, `UPDATE journal_entry SET posted_at = entry_date WHERE posted_at = '' OR posted_at IS NULL`); err != nil {
		return fmt.Errorf("backfill posted_at: %w", err)
	}
	if _, err := tx.ExecContext(ctx, `UPDATE journal_entry SET entry_kind = 'normal' WHERE entry_kind = '' OR entry_kind IS NULL`); err != nil {
		return fmt.Errorf("backfill entry_kind: %w", err)
	}
	if _, err := tx.ExecContext(ctx, `UPDATE journal_entry SET is_closing = 1 WHERE entry_kind = 'closing'`); err != nil {
		return fmt.Errorf("sync is_closing: %w", err)
	}

	return nil
}

func isSQLiteDuplicateColumn(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(strings.ToLower(msg), "duplicate column")
}

// DownExtendModel is not supported: SQLite cannot reliably drop added columns across versions.
func DownExtendModel(ctx context.Context, tx *sql.Tx) error {
	return errors.New("debk: down migration 20260412_extend_model is not supported; delete the database file to reset")
}
