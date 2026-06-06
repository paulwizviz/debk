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
	PermUserInvite = "user:invite"
)

// rolePermissions maps each role to its permissions (union for multiple roles).
var rolePermissions = map[string][]string{
	// Administrator: identity management, COA and business profile, and bookkeeping.
	operator.RoleAdmin: {
		PermBusinessRead, PermBusinessWrite,
		PermCoaRead, PermCoaWrite,
		PermJournalRead, PermJournalWrite,
		PermPeriodRead, PermPeriodWrite,
		PermReportRead,
		PermUserRead, PermUserWrite, PermUserInvite,
	},
	// User (bookkeeper): bookkeeping, reports, chart of accounts, and periods.
	// Can configure the books (COA + periods) but cannot assign identity
	// (no user:*) or edit the business profile (no business:write).
	operator.RoleUser: {
		PermBusinessRead,
		PermCoaRead, PermCoaWrite,
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
