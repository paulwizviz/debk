package operator

import (
	"context"
	"errors"
	"time"
)

const (
	TblOperator            = "operator"
	ColOperatorID          = "id"
	ColOperatorBusiness    = "business_id"
	ColOperatorLogin       = "login"
	ColOperatorDisplayName = "display_name"
	ColOperatorPassword    = "password_hash"
	ColOperatorStatus      = "status"
	ColOperatorCreated     = "created_at"

	TblOperatorRole     = "operator_role"
	ColORoleOperatorID  = "operator_id"
	ColORoleRole        = "role"

	StatusActive   = "active"
	StatusDisabled = "disabled"

	RoleFullAdmin = "full_admin"
	RoleConfigure = "configure"
	RoleBookkeep  = "bookkeep"
)

// Detail is a persisted operator (includes hash for repository use only).
type Detail struct {
	ID           int       `json:"id"`
	BusinessID   int       `json:"business_id"`
	Login        string    `json:"login"`
	DisplayName  string    `json:"display_name"`
	PasswordHash string    `json:"-"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	Roles        []string  `json:"roles,omitempty"`
}

// Public is safe JSON for APIs (no password hash).
type Public struct {
	ID          int       `json:"id"`
	BusinessID  int       `json:"business_id"`
	Login       string    `json:"login"`
	DisplayName string    `json:"display_name"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	Roles       []string  `json:"roles"`
}

func (d *Detail) Public() Public {
	return Public{
		ID:          d.ID,
		BusinessID:  d.BusinessID,
		Login:       d.Login,
		DisplayName: d.DisplayName,
		Status:      d.Status,
		CreatedAt:   d.CreatedAt,
		Roles:       append([]string(nil), d.Roles...),
	}
}

var (
	ErrNotFound       = errors.New("operator: not found")
	ErrLoginTaken     = errors.New("operator: login already in use")
	ErrInvalidRole    = errors.New("operator: invalid role")
	ErrBootstrapDone  = errors.New("operator: bootstrap already completed")
	ErrInvitePolicy   = errors.New("operator: this action is not allowed for the invited user scope")
)

// Repository persists operators and role assignments.
type Repository interface {
	CountByBusiness(ctx context.Context, businessID int) (int, error)
	Insert(ctx context.Context, d *Detail, roles []string) error
	GetByID(ctx context.Context, id int) (*Detail, error)
	GetByLogin(ctx context.Context, businessID int, login string) (*Detail, error)
	ListByBusiness(ctx context.Context, businessID int) ([]Detail, error)
	UpdateProfile(ctx context.Context, id int, displayName, status string) error
	ReplaceRoles(ctx context.Context, operatorID int, roles []string) error
	SetPasswordHash(ctx context.Context, id int, hash string) error
}

// Service manages operators and credentials.
type Service interface {
	CountByBusiness(ctx context.Context, businessID int) (int, error)
	Bootstrap(ctx context.Context, businessID int, login, displayName, plainPassword string) (*Public, error)
	Create(ctx context.Context, businessID int, login, displayName, plainPassword string, roles []string, actor *Detail) (*Public, error)
	Authenticate(ctx context.Context, businessID int, login, plainPassword string) (*Detail, error)
	Get(ctx context.Context, id int) (*Detail, error)
	List(ctx context.Context, businessID int) ([]Public, error)
	Update(ctx context.Context, id int, displayName, status string, roles []string, actor *Detail) error
	SetPassword(ctx context.Context, id int, plainPassword string, actor *Detail) error
}
