package period

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type repo struct {
	db *sql.DB
}

// NewRepository creates a new period repository.
func NewRepository(db *sql.DB) Repository {
	return &repo{db: db}
}

func (r *repo) Create(ctx context.Context, p *Detail) error {
	query := fmt.Sprintf("INSERT INTO %s (%s, %s, %s) VALUES (?, ?, ?)",
		TblPeriod, ColPeriodStart, ColPeriodEnd, ColPeriodIsClosed)
	res, err := r.db.ExecContext(ctx, query, p.Start.Format(time.RFC3339), p.End.Format(time.RFC3339), p.IsClosed)
	if err != nil {
		return fmt.Errorf("creating period: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return fmt.Errorf("getting last insert id: %w", err)
	}
	p.ID = int(id)
	return nil
}

func (r *repo) GetByID(ctx context.Context, id int) (*Detail, error) {
	query := fmt.Sprintf("SELECT %s, %s, %s, %s FROM %s WHERE %s = ?",
		ColPeriodID, ColPeriodStart, ColPeriodEnd, ColPeriodIsClosed, TblPeriod, ColPeriodID)
	row := r.db.QueryRowContext(ctx, query, id)
	var p Detail
	var startStr, endStr string
	if err := row.Scan(&p.ID, &startStr, &endStr, &p.IsClosed); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("period not found: %d", id)
		}
		return nil, fmt.Errorf("getting period by id: %w", err)
	}

	start, err := time.Parse(time.RFC3339, startStr)
	if err != nil {
		return nil, fmt.Errorf("parsing start date: %w", err)
	}
	p.Start = start

	end, err := time.Parse(time.RFC3339, endStr)
	if err != nil {
		return nil, fmt.Errorf("parsing end date: %w", err)
	}
	p.End = end

	return &p, nil
}

func (r *repo) List(ctx context.Context) ([]Detail, error) {
	query := fmt.Sprintf("SELECT %s, %s, %s, %s FROM %s ORDER BY %s DESC",
		ColPeriodID, ColPeriodStart, ColPeriodEnd, ColPeriodIsClosed, TblPeriod, ColPeriodStart)
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listing periods: %w", err)
	}
	defer rows.Close()

	var periods []Detail
	for rows.Next() {
		var p Detail
		var startStr, endStr string
		if err := rows.Scan(&p.ID, &startStr, &endStr, &p.IsClosed); err != nil {
			return nil, fmt.Errorf("scanning period: %w", err)
		}
		start, err := time.Parse(time.RFC3339, startStr)
		if err != nil {
			return nil, fmt.Errorf("parsing start date: %w", err)
		}
		p.Start = start

		end, err := time.Parse(time.RFC3339, endStr)
		if err != nil {
			return nil, fmt.Errorf("parsing end date: %w", err)
		}
		p.End = end
		periods = append(periods, p)
	}
	return periods, nil
}

func (r *repo) Update(ctx context.Context, p *Detail) error {
	query := fmt.Sprintf("UPDATE %s SET %s = ?, %s = ?, %s = ? WHERE %s = ?",
		TblPeriod, ColPeriodStart, ColPeriodEnd, ColPeriodIsClosed, ColPeriodID)
	_, err := r.db.ExecContext(ctx, query, p.Start.Format(time.RFC3339), p.End.Format(time.RFC3339), p.IsClosed, p.ID)
	if err != nil {
		return fmt.Errorf("updating period: %w", err)
	}
	return nil
}
