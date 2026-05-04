package dbmigrate

import (
	"context"
	"database/sql"

	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigrationContext(UpOperatorRolesAdminUser, DownOperatorRolesAdminUser)
}

// UpOperatorRolesAdminUser collapses legacy roles to admin and user.
func UpOperatorRolesAdminUser(ctx context.Context, tx *sql.Tx) error {
	stmts := []string{
		`UPDATE operator_role SET role = 'admin' WHERE role IN ('full_admin', 'configure')`,
		`UPDATE operator_role SET role = 'user' WHERE role = 'bookkeep'`,
		`DELETE FROM operator_role WHERE role = 'user' AND EXISTS (
			SELECT 1 FROM operator_role AS oa
			WHERE oa.operator_id = operator_role.operator_id AND oa.role = 'admin'
		)`,
	}
	for _, q := range stmts {
		if _, err := tx.ExecContext(ctx, q); err != nil {
			return err
		}
	}
	return nil
}

// DownOperatorRolesAdminUser maps admin/user back to full_admin/bookkeep (configure is not restored).
func DownOperatorRolesAdminUser(ctx context.Context, tx *sql.Tx) error {
	stmts := []string{
		`UPDATE operator_role SET role = 'full_admin' WHERE role = 'admin'`,
		`UPDATE operator_role SET role = 'bookkeep' WHERE role = 'user'`,
	}
	for _, q := range stmts {
		if _, err := tx.ExecContext(ctx, q); err != nil {
			return err
		}
	}
	return nil
}
