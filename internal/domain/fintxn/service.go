package fintxn

import (
	"context"
	"fmt"
)

type service struct{}

// NewService returns a placeholder financial-transaction service.
// Double-entry posting is implemented by jnlentry.Service.PostEntry (REST: POST /api/journal-entries).
func NewService() Service {
	return &service{}
}

func (s *service) HandleTransaction(ctx context.Context, tx *Detail) error {
	if tx == nil {
		return fmt.Errorf("nil financial transaction")
	}
	return fmt.Errorf("use journal posting API: fintxn.HandleTransaction is not wired; map business events to a balanced jnlentry.Detail and call PostEntry")
}
