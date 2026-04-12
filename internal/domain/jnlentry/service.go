package jnlentry

import (
	"context"
	"fmt"
	"math"
	"time"

	"debk/internal/domain/period"
)

type service struct {
	repo  Repository
	acct  AccountReader
	period PeriodReader
}

// NewService creates a journal entry service with posting validation.
func NewService(repo Repository, acct AccountReader, period PeriodReader) Service {
	return &service{repo: repo, acct: acct, period: period}
}

var allowedKinds = map[string]struct{}{
	EntryKindNormal:    {},
	EntryKindAdjusting: {},
	EntryKindClosing:   {},
}

func entryDateInPeriod(entryDate time.Time, p *period.Detail) bool {
	ed := entryDate.UTC()
	start := p.Start.UTC()
	end := p.End.UTC()
	ey, em, edd := ed.Date()
	sy, sm, sd := start.Date()
	eyy, emm, eddd := end.Date()
	edDay := time.Date(ey, em, edd, 0, 0, 0, 0, time.UTC)
	startDay := time.Date(sy, sm, sd, 0, 0, 0, 0, time.UTC)
	endDay := time.Date(eyy, emm, eddd, 0, 0, 0, 0, time.UTC)
	return !edDay.Before(startDay) && !edDay.After(endDay)
}

func (s *service) PostEntry(ctx context.Context, entry *Detail) error {
	if len(entry.Lines) < 2 {
		return fmt.Errorf("journal entry must have at least two lines")
	}
	if entry.BusinessID == 0 {
		entry.BusinessID = 1
	}
	if entry.PeriodID == 0 {
		return fmt.Errorf("period_id is required")
	}
	if entry.EntryKind == "" {
		entry.EntryKind = EntryKindNormal
	}
	if _, ok := allowedKinds[entry.EntryKind]; !ok {
		return fmt.Errorf("invalid entry_kind %q (use normal, adjusting, or closing)", entry.EntryKind)
	}
	entry.IsClosing = entry.EntryKind == EntryKindClosing

	now := time.Now().UTC()
	if entry.CreatedAt.IsZero() {
		entry.CreatedAt = now
	}
	if entry.PostedAt.IsZero() {
		entry.PostedAt = now
	}

	p, err := s.period.GetByID(ctx, entry.PeriodID)
	if err != nil {
		return fmt.Errorf("period: %w", err)
	}
	if p.BusinessID != entry.BusinessID {
		return fmt.Errorf("period %d does not belong to business %d", entry.PeriodID, entry.BusinessID)
	}
	if p.IsClosed {
		return fmt.Errorf("cannot post to a closed period")
	}
	if !entryDateInPeriod(entry.EntryDate, p) {
		return fmt.Errorf("entry_date must fall within the period (%s to %s)", p.Start.Format(time.DateOnly), p.End.Format(time.DateOnly))
	}

	var balance float64
	for i, line := range entry.Lines {
		if line.Amount <= 0 || math.IsNaN(line.Amount) || math.IsInf(line.Amount, 0) {
			return fmt.Errorf("line %d: amount must be a positive finite number", i)
		}
		switch line.Side {
		case Debit:
			balance += line.Amount
		case Credit:
			balance -= line.Amount
		default:
			return fmt.Errorf("line %d: invalid side %q", i, line.Side)
		}

		a, err := s.acct.GetByID(ctx, line.AccountID)
		if err != nil {
			return fmt.Errorf("line %d account %d: %w", i, line.AccountID, err)
		}
		if a.BusinessID != entry.BusinessID {
			return fmt.Errorf("line %d: account %d belongs to another business", i, line.AccountID)
		}
	}

	if math.Abs(balance) > 0.000001 {
		return fmt.Errorf("transaction must balance (debits minus credits = %f)", balance)
	}

	return s.repo.Create(ctx, entry)
}

func (s *service) GetEntry(ctx context.Context, id int) (*Detail, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) ListEntries(ctx context.Context, businessID int) ([]Detail, error) {
	if businessID == 0 {
		businessID = 1
	}
	return s.repo.List(ctx, businessID)
}
