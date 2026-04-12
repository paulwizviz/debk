package acct

import (
	"context"
	"database/sql"
	"fmt"
)

type repo struct {
	db *sql.DB
}

// NewRepository creates an account repository.
func NewRepository(db *sql.DB) Repository {
	return &repo{db: db}
}

func (r *repo) Create(ctx context.Context, account *Detail) error {
	query := fmt.Sprintf(`INSERT INTO %s (%s, %s, %s, %s, %s, %s) VALUES (?, ?, ?, ?, ?, ?)`,
		TblAcct, ColAcctBusiness, ColAcctCode, ColAcctName, ColAcctType, ColIsTemp, ColIsContra)
	res, err := r.db.ExecContext(ctx, query, account.BusinessID, account.Code, account.Name, account.Type, account.IsTemp, account.IsContra)
	if err != nil {
		return fmt.Errorf("creating account: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return fmt.Errorf("getting last insert id: %w", err)
	}
	account.ID = int(id)
	return nil
}

func (r *repo) GetByID(ctx context.Context, id int) (*Detail, error) {
	query := fmt.Sprintf(`SELECT %s, %s, %s, %s, %s, %s, %s FROM %s WHERE %s = ?`,
		ColAcctID, ColAcctBusiness, ColAcctCode, ColAcctName, ColAcctType, ColIsTemp, ColIsContra, TblAcct, ColAcctID)
	row := r.db.QueryRowContext(ctx, query, id)
	var account Detail
	if err := row.Scan(&account.ID, &account.BusinessID, &account.Code, &account.Name, &account.Type, &account.IsTemp, &account.IsContra); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("%w: %d", ErrNotFound, id)
		}
		return nil, fmt.Errorf("getting account by id: %w", err)
	}
	return &account, nil
}

func (r *repo) GetByCodeForBusiness(ctx context.Context, businessID int, code string) (*Detail, error) {
	query := fmt.Sprintf(`SELECT %s, %s, %s, %s, %s, %s, %s FROM %s WHERE %s = ? AND %s = ?`,
		ColAcctID, ColAcctBusiness, ColAcctCode, ColAcctName, ColAcctType, ColIsTemp, ColIsContra,
		TblAcct, ColAcctCode, ColAcctBusiness)
	row := r.db.QueryRowContext(ctx, query, code, businessID)
	var account Detail
	if err := row.Scan(&account.ID, &account.BusinessID, &account.Code, &account.Name, &account.Type, &account.IsTemp, &account.IsContra); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("%w: %s", ErrNotFound, code)
		}
		return nil, fmt.Errorf("getting account by code: %w", err)
	}
	return &account, nil
}

func (r *repo) ListForBusiness(ctx context.Context, businessID int) ([]Detail, error) {
	query := fmt.Sprintf(`SELECT %s, %s, %s, %s, %s, %s, %s FROM %s WHERE %s = ? ORDER BY %s`,
		ColAcctID, ColAcctBusiness, ColAcctCode, ColAcctName, ColAcctType, ColIsTemp, ColIsContra,
		TblAcct, ColAcctBusiness, ColAcctCode)
	rows, err := r.db.QueryContext(ctx, query, businessID)
	if err != nil {
		return nil, fmt.Errorf("listing accounts: %w", err)
	}
	defer rows.Close()

	var accounts []Detail
	for rows.Next() {
		var account Detail
		if err := rows.Scan(&account.ID, &account.BusinessID, &account.Code, &account.Name, &account.Type, &account.IsTemp, &account.IsContra); err != nil {
			return nil, fmt.Errorf("scanning account: %w", err)
		}
		accounts = append(accounts, account)
	}
	return accounts, nil
}

func (r *repo) Update(ctx context.Context, account *Detail) error {
	query := fmt.Sprintf(`UPDATE %s SET %s = ?, %s = ?, %s = ?, %s = ?, %s = ?, %s = ? WHERE %s = ?`,
		TblAcct, ColAcctBusiness, ColAcctCode, ColAcctName, ColAcctType, ColIsTemp, ColIsContra, ColAcctID)
	_, err := r.db.ExecContext(ctx, query, account.BusinessID, account.Code, account.Name, account.Type, account.IsTemp, account.IsContra, account.ID)
	if err != nil {
		return fmt.Errorf("updating account: %w", err)
	}
	return nil
}

func (r *repo) Delete(ctx context.Context, id int) error {
	query := fmt.Sprintf(`DELETE FROM %s WHERE %s = ?`, TblAcct, ColAcctID)
	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("deleting account: %w", err)
	}
	return nil
}
