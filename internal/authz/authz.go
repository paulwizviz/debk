package authz

import (
	"debk/internal/domain/operator"
)

// Permission names checked by REST handlers.
const (
	PermBusinessRead  = "business:read"
	PermBusinessWrite = "business:write"
	PermCoaRead       = "coa:read"
	PermCoaWrite      = "coa:write"
	PermJournalRead   = "journal:read"
	PermJournalWrite  = "journal:write"
	PermPeriodRead    = "period:read"
	PermPeriodWrite   = "period:write"
	PermReportRead    = "report:read"
	PermUserRead      = "user:read"
	PermUserWrite     = "user:write"
	// PermUserInvite allows creating or managing bookkeeper-only operators (configuration administrator — Bob → Charlene).
	PermUserInvite = "user:invite"
)

// rolePermissions maps each role to its permissions (union for multiple roles).
var rolePermissions = map[string][]string{
	operator.RoleFullAdmin: {
		PermBusinessRead, PermBusinessWrite,
		PermCoaRead, PermCoaWrite,
		PermJournalRead, PermJournalWrite,
		PermPeriodRead, PermPeriodWrite,
		PermReportRead,
		PermUserRead, PermUserWrite, PermUserInvite,
	},
	// Configuration administrator (Bob): configure the app, invite/manage bookkeeper-only users, and post journals.
	operator.RoleConfigure: {
		PermBusinessRead, PermBusinessWrite,
		PermCoaRead, PermCoaWrite,
		PermJournalRead, PermJournalWrite,
		PermPeriodRead, PermPeriodWrite,
		PermReportRead,
		PermUserRead, PermUserInvite,
	},
	operator.RoleBookkeep: {
		PermBusinessRead,
		PermCoaRead,
		PermJournalRead, PermJournalWrite,
		PermPeriodRead, PermPeriodWrite,
		PermReportRead,
	},
}

// Has reports whether roles grant the permission.
func Has(roles []string, perm string) bool {
	for _, r := range roles {
		for _, p := range rolePermissions[r] {
			if p == perm {
				return true
			}
		}
	}
	return false
}

// HasAny reports whether roles grant at least one of the permissions.
func HasAny(roles []string, perms ...string) bool {
	for _, perm := range perms {
		if Has(roles, perm) {
			return true
		}
	}
	return false
}
