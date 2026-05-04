package operator

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

type repo struct {
	db *sql.DB
}

// NewRepository builds an operator repository.
func NewRepository(db *sql.DB) Repository {
	return &repo{db: db}
}

func (r *repo) CountByBusiness(ctx context.Context, businessID int) (int, error) {
	q := fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE %s = ?`, TblOperator, ColOperatorBusiness)
	var n int
	if err := r.db.QueryRowContext(ctx, q, businessID).Scan(&n); err != nil {
		return 0, fmt.Errorf("operator count: %w", err)
	}
	return n, nil
}

func (r *repo) Insert(ctx context.Context, d *Detail, roles []string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("operator insert begin: %w", err)
	}
	defer tx.Rollback()

	q := fmt.Sprintf(`INSERT INTO %s (%s, %s, %s, %s, %s, %s) VALUES (?, ?, ?, ?, ?, ?)`,
		TblOperator, ColOperatorBusiness, ColOperatorLogin, ColOperatorDisplayName,
		ColOperatorPassword, ColOperatorStatus, ColOperatorCreated)
	res, err := tx.ExecContext(ctx, q, d.BusinessID, d.Login, d.DisplayName, d.PasswordHash, d.Status, d.CreatedAt.Format(time.RFC3339Nano))
	if err != nil {
		return fmt.Errorf("operator insert: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return fmt.Errorf("operator last id: %w", err)
	}
	d.ID = int(id)

	rq := fmt.Sprintf(`INSERT INTO %s (%s, %s) VALUES (?, ?)`, TblOperatorRole, ColORoleOperatorID, ColORoleRole)
	for _, role := range roles {
		if _, err := tx.ExecContext(ctx, rq, d.ID, role); err != nil {
			return fmt.Errorf("operator role insert: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("operator insert commit: %w", err)
	}
	return nil
}

func (r *repo) loadRoles(ctx context.Context, tx *sql.Tx, operatorID int) ([]string, error) {
	q := fmt.Sprintf(`SELECT %s FROM %s WHERE %s = ? ORDER BY %s`, ColORoleRole, TblOperatorRole, ColORoleOperatorID, ColORoleRole)
	var rows *sql.Rows
	var err error
	if tx != nil {
		rows, err = tx.QueryContext(ctx, q, operatorID)
	} else {
		rows, err = r.db.QueryContext(ctx, q, operatorID)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var roles []string
	for rows.Next() {
		var role string
		if err := rows.Scan(&role); err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, rows.Err()
}

func (r *repo) GetByID(ctx context.Context, id int) (*Detail, error) {
	q := fmt.Sprintf(`SELECT %s, %s, %s, %s, %s, %s, %s FROM %s WHERE %s = ?`,
		ColOperatorID, ColOperatorBusiness, ColOperatorLogin, ColOperatorDisplayName,
		ColOperatorPassword, ColOperatorStatus, ColOperatorCreated, TblOperator, ColOperatorID)
	row := r.db.QueryRowContext(ctx, q, id)
	var d Detail
	var created string
	if err := row.Scan(&d.ID, &d.BusinessID, &d.Login, &d.DisplayName, &d.PasswordHash, &d.Status, &created); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("operator get: %w", err)
	}
	var err error
	d.CreatedAt, err = time.Parse(time.RFC3339Nano, created)
	if err != nil {
		d.CreatedAt, err = time.Parse(time.RFC3339, created)
		if err != nil {
			return nil, fmt.Errorf("operator created_at: %w", err)
		}
	}
	d.Roles, err = r.loadRoles(ctx, nil, d.ID)
	if err != nil {
		return nil, fmt.Errorf("operator roles: %w", err)
	}
	return &d, nil
}

func (r *repo) GetByLogin(ctx context.Context, businessID int, login string) (*Detail, error) {
	q := fmt.Sprintf(`SELECT %s, %s, %s, %s, %s, %s, %s FROM %s WHERE %s = ? AND %s = ?`,
		ColOperatorID, ColOperatorBusiness, ColOperatorLogin, ColOperatorDisplayName,
		ColOperatorPassword, ColOperatorStatus, ColOperatorCreated, TblOperator,
		ColOperatorBusiness, ColOperatorLogin)
	row := r.db.QueryRowContext(ctx, q, businessID, login)
	var d Detail
	var created string
	if err := row.Scan(&d.ID, &d.BusinessID, &d.Login, &d.DisplayName, &d.PasswordHash, &d.Status, &created); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("operator get login: %w", err)
	}
	var err error
	d.CreatedAt, err = time.Parse(time.RFC3339Nano, created)
	if err != nil {
		d.CreatedAt, err = time.Parse(time.RFC3339, created)
		if err != nil {
			return nil, fmt.Errorf("operator created_at: %w", err)
		}
	}
	d.Roles, err = r.loadRoles(ctx, nil, d.ID)
	if err != nil {
		return nil, fmt.Errorf("operator roles: %w", err)
	}
	return &d, nil
}

func (r *repo) ListByBusiness(ctx context.Context, businessID int) ([]Detail, error) {
	q := fmt.Sprintf(`SELECT %s, %s, %s, %s, %s, %s, %s FROM %s WHERE %s = ? ORDER BY %s`,
		ColOperatorID, ColOperatorBusiness, ColOperatorLogin, ColOperatorDisplayName,
		ColOperatorPassword, ColOperatorStatus, ColOperatorCreated, TblOperator, ColOperatorBusiness, ColOperatorLogin)
	rows, err := r.db.QueryContext(ctx, q, businessID)
	if err != nil {
		return nil, fmt.Errorf("operator list: %w", err)
	}
	defer rows.Close()

	var out []Detail
	for rows.Next() {
		var d Detail
		var created string
		if err := rows.Scan(&d.ID, &d.BusinessID, &d.Login, &d.DisplayName, &d.PasswordHash, &d.Status, &created); err != nil {
			return nil, fmt.Errorf("operator scan: %w", err)
		}
		d.CreatedAt, err = time.Parse(time.RFC3339Nano, created)
		if err != nil {
			d.CreatedAt, _ = time.Parse(time.RFC3339, created)
		}
		d.Roles, err = r.loadRoles(ctx, nil, d.ID)
		if err != nil {
			return nil, fmt.Errorf("operator roles: %w", err)
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (r *repo) UpdateProfile(ctx context.Context, id int, displayName, status string) error {
	q := fmt.Sprintf(`UPDATE %s SET %s = ?, %s = ? WHERE %s = ?`,
		TblOperator, ColOperatorDisplayName, ColOperatorStatus, ColOperatorID)
	_, err := r.db.ExecContext(ctx, q, displayName, status, id)
	if err != nil {
		return fmt.Errorf("operator update profile: %w", err)
	}
	return nil
}

func (r *repo) ReplaceRoles(ctx context.Context, operatorID int, roles []string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("roles begin: %w", err)
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, fmt.Sprintf(`DELETE FROM %s WHERE %s = ?`, TblOperatorRole, ColORoleOperatorID), operatorID); err != nil {
		return fmt.Errorf("roles delete: %w", err)
	}
	rq := fmt.Sprintf(`INSERT INTO %s (%s, %s) VALUES (?, ?)`, TblOperatorRole, ColORoleOperatorID, ColORoleRole)
	for _, role := range roles {
		if _, err := tx.ExecContext(ctx, rq, operatorID, role); err != nil {
			return fmt.Errorf("roles insert: %w", err)
		}
	}
	return tx.Commit()
}

func (r *repo) SetPasswordHash(ctx context.Context, id int, hash string) error {
	q := fmt.Sprintf(`UPDATE %s SET %s = ? WHERE %s = ?`, TblOperator, ColOperatorPassword, ColOperatorID)
	_, err := r.db.ExecContext(ctx, q, hash, id)
	if err != nil {
		return fmt.Errorf("operator password: %w", err)
	}
	return nil
}
