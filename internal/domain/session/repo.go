package session

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

// NewRepository builds a session repository.
func NewRepository(db *sql.DB) Repository {
	return &repo{db: db}
}

func (r *repo) Insert(ctx context.Context, rec *Record) error {
	q := fmt.Sprintf(`INSERT INTO %s (%s, %s, %s, %s) VALUES (?, ?, ?, ?)`,
		TblSession, ColSessionID, ColSessionOperator, ColSessionCreated, ColSessionExpires)
	_, err := r.db.ExecContext(ctx, q, rec.ID, rec.OperatorID,
		rec.CreatedAt.Format(time.RFC3339Nano), rec.ExpiresAt.Format(time.RFC3339Nano))
	if err != nil {
		return fmt.Errorf("session insert: %w", err)
	}
	return nil
}

func (r *repo) Get(ctx context.Context, id string) (*Record, error) {
	q := fmt.Sprintf(`SELECT %s, %s, %s, %s FROM %s WHERE %s = ?`,
		ColSessionID, ColSessionOperator, ColSessionCreated, ColSessionExpires, TblSession, ColSessionID)
	row := r.db.QueryRowContext(ctx, q, id)
	var rec Record
	var c, e string
	if err := row.Scan(&rec.ID, &rec.OperatorID, &c, &e); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInvalid
		}
		return nil, fmt.Errorf("session get: %w", err)
	}
	var err error
	rec.CreatedAt, err = time.Parse(time.RFC3339Nano, c)
	if err != nil {
		rec.CreatedAt, _ = time.Parse(time.RFC3339, c)
	}
	rec.ExpiresAt, err = time.Parse(time.RFC3339Nano, e)
	if err != nil {
		rec.ExpiresAt, _ = time.Parse(time.RFC3339, e)
	}
	return &rec, nil
}

func (r *repo) Delete(ctx context.Context, id string) error {
	q := fmt.Sprintf(`DELETE FROM %s WHERE %s = ?`, TblSession, ColSessionID)
	_, err := r.db.ExecContext(ctx, q, id)
	return err
}

func (r *repo) DeleteForOperator(ctx context.Context, operatorID int) error {
	q := fmt.Sprintf(`DELETE FROM %s WHERE %s = ?`, TblSession, ColSessionOperator)
	_, err := r.db.ExecContext(ctx, q, operatorID)
	return err
}
