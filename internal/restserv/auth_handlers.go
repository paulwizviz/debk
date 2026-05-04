package restserv

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"debk/internal/authz"
	"debk/internal/domain/operator"
)

type bootstrapStatusResponse struct {
	NeedsBootstrap bool `json:"needs_bootstrap"`
}

func (r *RESTFul) getBootstrapStatus(w http.ResponseWriter, req *http.Request) {
	bid := parseBusinessID(req)
	n, err := r.operatorSvc.CountByBusiness(req.Context(), bid)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, bootstrapStatusResponse{NeedsBootstrap: n == 0})
}

type bootstrapRequest struct {
	BusinessID  int    `json:"business_id"`
	Login       string `json:"login"`
	DisplayName string `json:"display_name"`
	Password    string `json:"password"`
}

func (r *RESTFul) postBootstrap(w http.ResponseWriter, req *http.Request) {
	var body bootstrapRequest
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if body.BusinessID == 0 {
		body.BusinessID = parseBusinessID(req)
	}
	if body.Login == "" || body.Password == "" {
		http.Error(w, "login and password are required", http.StatusBadRequest)
		return
	}
	if body.DisplayName == "" {
		body.DisplayName = body.Login
	}
	pub, err := r.operatorSvc.Bootstrap(req.Context(), body.BusinessID, body.Login, body.DisplayName, body.Password)
	if err != nil {
		if errors.Is(err, operator.ErrBootstrapDone) {
			http.Error(w, "bootstrap already completed", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	rec, err := r.sessionSvc.Create(req.Context(), pub.ID, sessionTTL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.setSessionCookie(w, rec.ID)
	r.json(w, pub)
}

type loginRequest struct {
	BusinessID int    `json:"business_id"`
	Login      string `json:"login"`
	Password   string `json:"password"`
}

func (r *RESTFul) postLogin(w http.ResponseWriter, req *http.Request) {
	var body loginRequest
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if body.BusinessID == 0 {
		body.BusinessID = parseBusinessID(req)
	}
	op, err := r.operatorSvc.Authenticate(req.Context(), body.BusinessID, body.Login, body.Password)
	if err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	rec, err := r.sessionSvc.Create(req.Context(), op.ID, sessionTTL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.setSessionCookie(w, rec.ID)
	r.json(w, op.Public())
}

func (r *RESTFul) postLogout(w http.ResponseWriter, req *http.Request) {
	if c, err := req.Cookie(sessionCookieName); err == nil && c.Value != "" {
		_ = r.sessionSvc.Logout(req.Context(), c.Value)
	}
	r.clearSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (r *RESTFul) getMe(w http.ResponseWriter, req *http.Request) {
	op, ok := r.guard(w, req, "")
	if !ok {
		return
	}
	r.json(w, op.Public())
}

func (r *RESTFul) listOperators(w http.ResponseWriter, req *http.Request) {
	if _, ok := r.guardAnyPerm(w, req, authz.PermUserRead, authz.PermUserInvite); !ok {
		return
	}
	bid := parseBusinessID(req)
	list, err := r.operatorSvc.List(req.Context(), bid)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, list)
}

type createOperatorRequest struct {
	Login       string   `json:"login"`
	DisplayName string   `json:"display_name"`
	Password    string   `json:"password"`
	Roles       []string `json:"roles"`
}

func (r *RESTFul) createOperator(w http.ResponseWriter, req *http.Request) {
	op, ok := r.guardUserWriteOrInvite(w, req)
	if !ok {
		return
	}
	bid := parseBusinessID(req)
	var body createOperatorRequest
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if body.Login == "" || body.Password == "" || len(body.Roles) == 0 {
		http.Error(w, "login, password, and roles are required", http.StatusBadRequest)
		return
	}
	if body.DisplayName == "" {
		body.DisplayName = body.Login
	}
	pub, err := r.operatorSvc.Create(req.Context(), bid, body.Login, body.DisplayName, body.Password, body.Roles, op)
	if err != nil {
		if errors.Is(err, operator.ErrInvitePolicy) {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		if isUniqueViolation(err) {
			http.Error(w, "login already in use", http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	r.json(w, pub)
}

type patchOperatorRequest struct {
	DisplayName string   `json:"display_name"`
	Status      string   `json:"status"`
	Roles       []string `json:"roles"`
}

func (r *RESTFul) patchOperator(w http.ResponseWriter, req *http.Request) {
	op, ok := r.guardUserWriteOrInvite(w, req)
	if !ok {
		return
	}
	id, err := strconv.Atoi(req.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	target, err := r.operatorSvc.Get(req.Context(), id)
	if err != nil || target.BusinessID != op.BusinessID {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	var body patchOperatorRequest
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := r.operatorSvc.Update(req.Context(), id, body.DisplayName, body.Status, body.Roles, op); err != nil {
		if errors.Is(err, operator.ErrNotFound) {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, operator.ErrInvitePolicy) {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	updated, err := r.operatorSvc.Get(req.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, updated.Public())
}

type passwordResetRequest struct {
	Password string `json:"password"`
}

func (r *RESTFul) postOperatorPassword(w http.ResponseWriter, req *http.Request) {
	op, ok := r.guardUserWriteOrInvite(w, req)
	if !ok {
		return
	}
	id, err := strconv.Atoi(req.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	target, err := r.operatorSvc.Get(req.Context(), id)
	if err != nil || target.BusinessID != op.BusinessID {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	var body passwordResetRequest
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if body.Password == "" {
		http.Error(w, "password is required", http.StatusBadRequest)
		return
	}
	if err := r.operatorSvc.SetPassword(req.Context(), id, body.Password, op); err != nil {
		if errors.Is(err, operator.ErrNotFound) {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, operator.ErrInvitePolicy) {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
