package fintxn

import (
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
