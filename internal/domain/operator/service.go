package operator

import (
	"context"
	"fmt"
	"slices"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type service struct {
	repo Repository
}

// NewService creates an operator service.
func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func isAdmin(d *Detail) bool {
	if d == nil {
		return false
	}
	return slices.Contains(d.Roles, RoleAdmin)
}

func dedupeRoles(roles []string) []string {
	seen := make(map[string]struct{})
	out := make([]string, 0, len(roles))
	for _, r := range roles {
		if _, ok := seen[r]; ok {
			continue
		}
		seen[r] = struct{}{}
		out = append(out, r)
	}
	return out
}

// normalizeRoles keeps a single admin role if present, otherwise user roles.
func normalizeRoles(roles []string) []string {
	roles = dedupeRoles(roles)
	if slices.Contains(roles, RoleAdmin) {
		return []string{RoleAdmin}
	}
	return roles
}

func validRoles(roles []string) error {
	allowed := map[string]struct{}{
		RoleAdmin: {},
		RoleUser:  {},
	}
	for _, r := range roles {
		if _, ok := allowed[r]; !ok {
			return fmt.Errorf("%w: %q", ErrInvalidRole, r)
		}
	}
	return nil
}

func hashPassword(plain string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(b), nil
}

func (s *service) CountByBusiness(ctx context.Context, businessID int) (int, error) {
	return s.repo.CountByBusiness(ctx, businessID)
}

func (s *service) Bootstrap(ctx context.Context, businessID int, login, displayName, plainPassword string) (*Public, error) {
	n, err := s.repo.CountByBusiness(ctx, businessID)
	if err != nil {
		return nil, err
	}
	if n > 0 {
		return nil, ErrBootstrapDone
	}
	if err := validRoles([]string{RoleAdmin}); err != nil {
		return nil, err
	}
	hash, err := hashPassword(plainPassword)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	d := &Detail{
		BusinessID:   businessID,
		Login:        login,
		DisplayName:  displayName,
		PasswordHash: hash,
		Status:       StatusActive,
		CreatedAt:    now,
	}
	if err := s.repo.Insert(ctx, d, []string{RoleAdmin}); err != nil {
		return nil, fmt.Errorf("bootstrap insert: %w", err)
	}
	d.Roles = []string{RoleAdmin}
	p := d.Public()
	return &p, nil
}

func (s *service) Create(ctx context.Context, businessID int, login, displayName, plainPassword string, roles []string, actor *Detail) (*Public, error) {
	if len(roles) == 0 {
		return nil, fmt.Errorf("%w: at least one role required", ErrInvalidRole)
	}
	if err := validRoles(roles); err != nil {
		return nil, err
	}
	roles = normalizeRoles(roles)
	if actor != nil && !isAdmin(actor) {
		return nil, ErrInvitePolicy
	}
	hash, err := hashPassword(plainPassword)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	d := &Detail{
		BusinessID:   businessID,
		Login:        login,
		DisplayName:  displayName,
		PasswordHash: hash,
		Status:       StatusActive,
		CreatedAt:    now,
	}
	if err := s.repo.Insert(ctx, d, roles); err != nil {
		return nil, fmt.Errorf("operator create: %w", err)
	}
	d.Roles = append([]string(nil), roles...)
	p := d.Public()
	return &p, nil
}

func (s *service) Authenticate(ctx context.Context, businessID int, login, plainPassword string) (*Detail, error) {
	d, err := s.repo.GetByLogin(ctx, businessID, login)
	if err != nil {
		return nil, err
	}
	if d.Status != StatusActive {
		return nil, ErrNotFound
	}
	if err := bcrypt.CompareHashAndPassword([]byte(d.PasswordHash), []byte(plainPassword)); err != nil {
		return nil, ErrNotFound
	}
	return d, nil
}

func (s *service) Get(ctx context.Context, id int) (*Detail, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) List(ctx context.Context, businessID int) ([]Public, error) {
	list, err := s.repo.ListByBusiness(ctx, businessID)
	if err != nil {
		return nil, err
	}
	out := make([]Public, 0, len(list))
	for i := range list {
		out = append(out, list[i].Public())
	}
	return out, nil
}

func (s *service) Update(ctx context.Context, id int, displayName, status string, roles []string, actor *Detail) error {
	if status != "" && status != StatusActive && status != StatusDisabled {
		return fmt.Errorf("invalid status %q", status)
	}
	if len(roles) > 0 {
		if err := validRoles(roles); err != nil {
			return err
		}
		roles = normalizeRoles(roles)
	}
	d, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if actor != nil && !isAdmin(actor) {
		return ErrInvitePolicy
	}
	dn := d.DisplayName
	if displayName != "" {
		dn = displayName
	}
	st := d.Status
	if status != "" {
		st = status
	}
	if err := s.repo.UpdateProfile(ctx, id, dn, st); err != nil {
		return err
	}
	if len(roles) > 0 {
		return s.repo.ReplaceRoles(ctx, id, roles)
	}
	return nil
}

func (s *service) SetPassword(ctx context.Context, id int, plainPassword string, actor *Detail) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if actor != nil && !isAdmin(actor) {
		return ErrInvitePolicy
	}
	hash, err := hashPassword(plainPassword)
	if err != nil {
		return err
	}
	return s.repo.SetPasswordHash(ctx, id, hash)
}
