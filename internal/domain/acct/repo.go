package acct

import (
	"context"
	"database/sql"
	"fmt"
)

type repo struct {
	db *sql.DB
}

// NewRepository creates a new account repository.
func NewRepository(db *sql.DB) Repository {
	return &repo{db: db}
}

func (r *repo) Create(ctx context.Context, account *Detail) error {
	query := fmt.Sprintf("INSERT INTO %s (%s, %s, %s, %s, %s) VALUES (?, ?, ?, ?, ?)",
		TblAcct, ColAcctCode, ColAcctName, ColAcctType, ColIsTemp, ColIsContra)
	res, err := r.db.ExecContext(ctx, query, account.Code, account.Name, account.Type, account.IsTemp, account.IsContra)
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
	query := fmt.Sprintf("SELECT %s, %s, %s, %s, %s, %s FROM %s WHERE %s = ?",
		ColAcctID, ColAcctCode, ColAcctName, ColAcctType, ColIsTemp, ColIsContra, TblAcct, ColAcctID)
	row := r.db.QueryRowContext(ctx, query, id)
	var account Detail
	if err := row.Scan(&account.ID, &account.Code, &account.Name, &account.Type, &account.IsTemp, &account.IsContra); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("account not found: %d", id)
		}
		return nil, fmt.Errorf("getting account by id: %w", err)
	}
	return &account, nil
}

func (r *repo) GetByCode(ctx context.Context, code string) (*Detail, error) {
	query := fmt.Sprintf("SELECT %s, %s, %s, %s, %s, %s FROM %s WHERE %s = ?",
		ColAcctID, ColAcctCode, ColAcctName, ColAcctType, ColIsTemp, ColIsContra, TblAcct, ColAcctCode)
	row := r.db.QueryRowContext(ctx, query, code)
	var account Detail
	if err := row.Scan(&account.ID, &account.Code, &account.Name, &account.Type, &account.IsTemp, &account.IsContra); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("account not found: %s", code)
		}
		return nil, fmt.Errorf("getting account by code: %w", err)
	}
	return &account, nil
}

func (r *repo) List(ctx context.Context) ([]Detail, error) {
	query := fmt.Sprintf("SELECT %s, %s, %s, %s, %s, %s FROM %s",
		ColAcctID, ColAcctCode, ColAcctName, ColAcctType, ColIsTemp, ColIsContra, TblAcct)
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listing accounts: %w", err)
	}
	defer rows.Close()

	var accounts []Detail
	for rows.Next() {
		var account Detail
		if err := rows.Scan(&account.ID, &account.Code, &account.Name, &account.Type, &account.IsTemp, &account.IsContra); err != nil {
			return nil, fmt.Errorf("scanning account: %w", err)
		}
		accounts = append(accounts, account)
	}
	return accounts, nil
}

func (r *repo) Update(ctx context.Context, account *Detail) error {
	query := fmt.Sprintf("UPDATE %s SET %s = ?, %s = ?, %s = ?, %s = ?, %s = ? WHERE %s = ?",
		TblAcct, ColAcctCode, ColAcctName, ColAcctType, ColIsTemp, ColIsContra, TblAcct, ColAcctID)
	_, err := r.db.ExecContext(ctx, query, account.Code, account.Name, account.Type, account.IsTemp, account.IsContra, account.ID)
	if err != nil {
		return fmt.Errorf("updating account: %w", err)
	}
	return nil
}

func (r *repo) Delete(ctx context.Context, id int) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE %s = ?", TblAcct, ColAcctID)
	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("deleting account: %w", err)
	}
	return nil
}
