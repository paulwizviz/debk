package dbmigrate

import (
	"context"
	"database/sql"
	"fmt"

	"debk/internal/domain/acct"
	"debk/internal/domain/jnlentry"
	"debk/internal/domain/period"

	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigrationContext(UpCreateDomainTables, DownCreateDomainTables)
}

// UpCreateDomainTables creates all domain-related tables in the correct order.
func UpCreateDomainTables(ctx context.Context, tx *sql.Tx) error {
	if _, err := tx.ExecContext(ctx, acct.CreateAcctTableSQL); err != nil {
		return fmt.Errorf("creating account table: %w", err)
	}
	if _, err := tx.ExecContext(ctx, period.CreatePeriodTableSQL); err != nil {
		return fmt.Errorf("creating period table: %w", err)
	}

	if _, err := tx.ExecContext(ctx, jnlentry.CreateEntryTableSQL); err != nil {
		return fmt.Errorf("creating journal entry table: %w", err)
	}
	if _, err := tx.ExecContext(ctx, jnlentry.CreateLineTableSQL); err != nil {
		return fmt.Errorf("creating journal line table: %w", err)
	}

	return nil
}

// DownCreateDomainTables drops all domain-related tables in reverse order.
func DownCreateDomainTables(ctx context.Context, tx *sql.Tx) error {
	if _, err := tx.ExecContext(ctx, "DROP TABLE IF EXISTS "+jnlentry.TblLine); err != nil {
		return fmt.Errorf("dropping journal line table: %w", err)
	}
	if _, err := tx.ExecContext(ctx, "DROP TABLE IF EXISTS "+jnlentry.TblEntry); err != nil {
		return fmt.Errorf("dropping journal entry table: %w", err)
	}

	if _, err := tx.ExecContext(ctx, "DROP TABLE IF EXISTS "+period.TblPeriod); err != nil {
		return fmt.Errorf("dropping period table: %w", err)
	}
	if _, err := tx.ExecContext(ctx, "DROP TABLE IF EXISTS "+acct.TblAcct); err != nil {
		return fmt.Errorf("dropping account table: %w", err)
	}

	return nil
}
