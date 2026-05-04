package restserv

import (
	"net/http"
	"strings"
	"time"

	"debk/internal/authz"
	"debk/internal/domain/operator"
)

const (
	sessionCookieName = "debk_session"
	sessionTTL        = 7 * 24 * time.Hour
)

func (r *RESTFul) setSessionCookie(w http.ResponseWriter, sessionID string) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    sessionID,
		Path:     "/",
		MaxAge:   int(sessionTTL.Seconds()),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func (r *RESTFul) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

// requireOperator validates session, business scope, and active operator.
func (r *RESTFul) requireOperator(w http.ResponseWriter, req *http.Request) (*operator.Detail, bool) {
	c, err := req.Cookie(sessionCookieName)
	if err != nil || c.Value == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return nil, false
	}
	oid, err := r.sessionSvc.Validate(req.Context(), c.Value)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return nil, false
	}
	op, err := r.operatorSvc.Get(req.Context(), oid)
	if err != nil || op.Status != operator.StatusActive {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return nil, false
	}
	bid := parseBusinessID(req)
	if bid != op.BusinessID {
		http.Error(w, "forbidden", http.StatusForbidden)
		return nil, false
	}
	return op, true
}

// guard checks authentication and optional permission (empty perm = authenticated only).
func (r *RESTFul) guard(w http.ResponseWriter, req *http.Request, perm string) (*operator.Detail, bool) {
	op, ok := r.requireOperator(w, req)
	if !ok {
		return nil, false
	}
	if perm != "" && !authz.Has(op.Roles, perm) {
		http.Error(w, "forbidden", http.StatusForbidden)
		return nil, false
	}
	return op, true
}

// guardAnyPerm checks session, business scope, and that the operator has at least one of the permissions.
func (r *RESTFul) guardAnyPerm(w http.ResponseWriter, req *http.Request, perms ...string) (*operator.Detail, bool) {
	op, ok := r.requireOperator(w, req)
	if !ok {
		return nil, false
	}
	if parseBusinessID(req) != op.BusinessID {
		http.Error(w, "forbidden", http.StatusForbidden)
		return nil, false
	}
	if !authz.HasAny(op.Roles, perms...) {
		http.Error(w, "forbidden", http.StatusForbidden)
		return nil, false
	}
	return op, true
}

// guardUserWriteOrInvite is for creating or managing operators within invite or full-admin scope.
func (r *RESTFul) guardUserWriteOrInvite(w http.ResponseWriter, req *http.Request) (*operator.Detail, bool) {
	return r.guardAnyPerm(w, req, authz.PermUserWrite, authz.PermUserInvite)
}

func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(strings.ToLower(err.Error()), "unique")
}
