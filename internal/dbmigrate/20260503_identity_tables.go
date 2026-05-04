package dbmigrate

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigrationContext(UpIdentityTables, DownIdentityTables)
}

// UpIdentityTables adds operators, roles, and sessions for local IAM.
func UpIdentityTables(ctx context.Context, tx *sql.Tx) error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS operator (
			id INTEGER PRIMARY KEY,
			business_id INTEGER NOT NULL,
			login TEXT NOT NULL,
			display_name TEXT NOT NULL,
			password_hash TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'active',
			created_at TEXT NOT NULL,
			UNIQUE(business_id, login),
			FOREIGN KEY(business_id) REFERENCES business(id)
		)`,
		`CREATE TABLE IF NOT EXISTS operator_role (
			operator_id INTEGER NOT NULL,
			role TEXT NOT NULL,
			PRIMARY KEY (operator_id, role),
			FOREIGN KEY(operator_id) REFERENCES operator(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS session (
			id TEXT PRIMARY KEY,
			operator_id INTEGER NOT NULL,
			created_at TEXT NOT NULL,
			expires_at TEXT NOT NULL,
			FOREIGN KEY(operator_id) REFERENCES operator(id) ON DELETE CASCADE
		)`,
	}
	for _, s := range stmts {
		if _, err := tx.ExecContext(ctx, s); err != nil {
			return fmt.Errorf("identity migration: %w", err)
		}
	}
	return nil
}

func DownIdentityTables(ctx context.Context, tx *sql.Tx) error {
	for _, s := range []string{
		`DROP TABLE IF EXISTS session`,
		`DROP TABLE IF EXISTS operator_role`,
		`DROP TABLE IF EXISTS operator`,
	} {
		if _, err := tx.ExecContext(ctx, s); err != nil {
			return fmt.Errorf("identity down: %w", err)
		}
	}
	return nil
}
