package fintxn

import (
	"context"
	"time"
)

// Detail represents a financial transaction event from a business perspective.
// It is a domain event that typically leads to the creation of one or more journal entries.
type Detail struct {
	ID          string
	OccurredAt  time.Time
	Description string
	Amount      float64
	Currency    string
	Metadata    map[string]string
}

// Service defines the business logic for handling financial transaction events.
type Service interface {
	HandleTransaction(ctx context.Context, tx *Detail) error
}
