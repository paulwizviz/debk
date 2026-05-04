package session

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"
)

type service struct {
	repo Repository
}

// NewService creates a session service.
func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func newSessionID() (string, error) {
	var b [32]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", fmt.Errorf("session id: %w", err)
	}
	return hex.EncodeToString(b[:]), nil
}

func (s *service) Create(ctx context.Context, operatorID int, ttl time.Duration) (*Record, error) {
	id, err := newSessionID()
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	rec := &Record{
		ID:         id,
		OperatorID: operatorID,
		CreatedAt:  now,
		ExpiresAt:  now.Add(ttl),
	}
	if err := s.repo.Insert(ctx, rec); err != nil {
		return nil, err
	}
	return rec, nil
}

func (s *service) Validate(ctx context.Context, sessionID string) (int, error) {
	if sessionID == "" {
		return 0, ErrInvalid
	}
	rec, err := s.repo.Get(ctx, sessionID)
	if err != nil {
		return 0, err
	}
	if time.Now().UTC().After(rec.ExpiresAt) {
		_ = s.repo.Delete(ctx, sessionID)
		return 0, ErrInvalid
	}
	return rec.OperatorID, nil
}

func (s *service) Logout(ctx context.Context, sessionID string) error {
	if sessionID == "" {
		return nil
	}
	return s.repo.Delete(ctx, sessionID)
}
