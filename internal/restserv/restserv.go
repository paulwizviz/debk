package restserv

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"debk/internal/domain/acct"
	"debk/internal/domain/jnlentry"
	"debk/internal/domain/period"
)

type RESTFul struct {
	db          *sql.DB
	acctSvc     acct.Service
	jnlSvc      jnlentry.Service
	periodSvc   period.Service
}

func New(mux *http.ServeMux, db *sql.DB) *http.ServeMux {
	acctRepo := acct.NewRepository(db)
	acctSvc := acct.NewService(acctRepo)

	jnlRepo := jnlentry.NewRepository(db)
	jnlSvc := jnlentry.NewService(jnlRepo)

	periodRepo := period.NewRepository(db)
	periodSvc := period.NewService(periodRepo)

	r := &RESTFul{
		db:        db,
		acctSvc:   acctSvc,
		jnlSvc:    jnlSvc,
		periodSvc: periodSvc,
	}

	// Register routes
	r.registerRoutes(mux)

	return mux
}

func (r *RESTFul) registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/accounts", r.listAccounts)
	mux.HandleFunc("POST /api/accounts", r.createAccount)

	mux.HandleFunc("GET /api/journal-entries", r.listEntries)
	mux.HandleFunc("POST /api/journal-entries", r.postEntry)

	mux.HandleFunc("GET /api/periods", r.listPeriods)
	mux.HandleFunc("POST /api/periods", r.openPeriod)
}

// Account Handlers

func (r *RESTFul) listAccounts(w http.ResponseWriter, req *http.Request) {
	accounts, err := r.acctSvc.ListAccounts(req.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, accounts)
}

func (r *RESTFul) createAccount(w http.ResponseWriter, req *http.Request) {
	var detail acct.Detail
	if err := json.NewDecoder(req.Body).Decode(&detail); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := r.acctSvc.CreateAccount(req.Context(), &detail); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, detail)
}

// Journal Entry Handlers

func (r *RESTFul) listEntries(w http.ResponseWriter, req *http.Request) {
	entries, err := r.jnlSvc.ListEntries(req.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, entries)
}

func (r *RESTFul) postEntry(w http.ResponseWriter, req *http.Request) {
	var detail jnlentry.Detail
	if err := json.NewDecoder(req.Body).Decode(&detail); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := r.jnlSvc.PostEntry(req.Context(), &detail); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, detail)
}

// Period Handlers

func (r *RESTFul) listPeriods(w http.ResponseWriter, req *http.Request) {
	periods, err := r.periodSvc.ListPeriods(req.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, periods)
}

type openPeriodRequest struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

func (r *RESTFul) openPeriod(w http.ResponseWriter, req *http.Request) {
	var opr openPeriodRequest
	if err := json.NewDecoder(req.Body).Decode(&opr); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	p, err := r.periodSvc.OpenPeriod(req.Context(), opr.Start, opr.End)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, p)
}

// Helper methods

func (r *RESTFul) json(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
