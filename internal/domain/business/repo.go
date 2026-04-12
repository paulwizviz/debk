package business

import (
	"context"
	"database/sql"
	"fmt"
)

type repo struct {
	db *sql.DB
}

// NewRepository builds a business repository.
func NewRepository(db *sql.DB) Repository {
	return &repo{db: db}
}

func (r *repo) GetByID(ctx context.Context, id int) (*Detail, error) {
	q := fmt.Sprintf(`SELECT %s, %s, %s FROM %s WHERE %s = ?`,
		ColBusinessID, ColBusinessLegalName, ColBusinessCurrency, TblBusiness, ColBusinessID)
	row := r.db.QueryRowContext(ctx, q, id)
	var d Detail
	if err := row.Scan(&d.ID, &d.LegalName, &d.FunctionalCurrency); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("business not found: %d", id)
		}
		return nil, fmt.Errorf("business get: %w", err)
	}
	return &d, nil
}

func (r *repo) List(ctx context.Context) ([]Detail, error) {
	q := fmt.Sprintf(`SELECT %s, %s, %s FROM %s ORDER BY %s`,
		ColBusinessID, ColBusinessLegalName, ColBusinessCurrency, TblBusiness, ColBusinessID)
	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("business list: %w", err)
	}
	defer rows.Close()

	var out []Detail
	for rows.Next() {
		var d Detail
		if err := rows.Scan(&d.ID, &d.LegalName, &d.FunctionalCurrency); err != nil {
			return nil, fmt.Errorf("business scan: %w", err)
		}
		out = append(out, d)
	}
	return out, nil
}

func (r *repo) Update(ctx context.Context, d *Detail) error {
	q := fmt.Sprintf(`UPDATE %s SET %s = ?, %s = ? WHERE %s = ?`,
		TblBusiness, ColBusinessLegalName, ColBusinessCurrency, ColBusinessID)
	_, err := r.db.ExecContext(ctx, q, d.LegalName, d.FunctionalCurrency, d.ID)
	if err != nil {
		return fmt.Errorf("business update: %w", err)
	}
	return nil
}
