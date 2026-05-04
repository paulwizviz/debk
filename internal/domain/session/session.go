package session

import (
	"context"
	"errors"
	"time"
)

const (
	TblSession         = "session"
	ColSessionID       = "id"
	ColSessionOperator = "operator_id"
	ColSessionCreated  = "created_at"
	ColSessionExpires  = "expires_at"
)

// Record is a persisted browser session.
type Record struct {
	ID         string    `json:"id"`
	OperatorID int       `json:"operator_id"`
	CreatedAt  time.Time `json:"created_at"`
	ExpiresAt  time.Time `json:"expires_at"`
}

var ErrInvalid = errors.New("session: invalid or expired")

// Repository persists sessions.
type Repository interface {
	Insert(ctx context.Context, rec *Record) error
	Get(ctx context.Context, id string) (*Record, error)
	Delete(ctx context.Context, id string) error
	DeleteForOperator(ctx context.Context, operatorID int) error
}

// Service issues and validates sessions.
type Service interface {
	Create(ctx context.Context, operatorID int, ttl time.Duration) (*Record, error)
	Validate(ctx context.Context, sessionID string) (operatorID int, err error)
	Logout(ctx context.Context, sessionID string) error
}
