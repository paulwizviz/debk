package restserv

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"debk/internal/domain/acct"
	"debk/internal/domain/business"
	"debk/internal/domain/jnlentry"
	"debk/internal/domain/period"
	"debk/internal/domain/report"
)

type RESTFul struct {
	db           *sql.DB
	acctSvc      acct.Service
	jnlSvc       jnlentry.Service
	periodSvc    period.Service
	businessSvc  business.Service
	reportSvc    *report.Service
}

func New(mux *http.ServeMux, db *sql.DB) *http.ServeMux {
	acctRepo := acct.NewRepository(db)
	acctSvc := acct.NewService(acctRepo)

	periodRepo := period.NewRepository(db)
	periodSvc := period.NewService(periodRepo)

	jnlRepo := jnlentry.NewRepository(db)
	jnlSvc := jnlentry.NewService(jnlRepo, acctRepo, periodRepo)

	businessRepo := business.NewRepository(db)
	businessSvc := business.NewService(businessRepo)

	r := &RESTFul{
		db:          db,
		acctSvc:     acctSvc,
		jnlSvc:      jnlSvc,
		periodSvc:   periodSvc,
		businessSvc: businessSvc,
		reportSvc:   report.NewService(db),
	}

	r.registerRoutes(mux)
	return mux
}

func (r *RESTFul) registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/business", r.listBusiness)
	mux.HandleFunc("GET /api/business/{id}", r.getBusiness)
	mux.HandleFunc("PATCH /api/business/{id}", r.patchBusiness)

	mux.HandleFunc("GET /api/accounts", r.listAccounts)
	mux.HandleFunc("GET /api/accounts/{id}", r.getAccount)
	mux.HandleFunc("POST /api/accounts", r.createAccount)

	mux.HandleFunc("GET /api/journal-entries", r.listEntries)
	mux.HandleFunc("GET /api/journal-entries/{id}", r.getEntry)
	mux.HandleFunc("POST /api/journal-entries", r.postEntry)

	mux.HandleFunc("GET /api/periods", r.listPeriods)
	mux.HandleFunc("POST /api/periods", r.openPeriod)
	mux.HandleFunc("POST /api/periods/{id}/close", r.closePeriod)

	mux.HandleFunc("GET /api/reports/trial-balance", r.trialBalance)
	mux.HandleFunc("GET /api/reports/income-statement", r.incomeStatement)
	mux.HandleFunc("GET /api/reports/balance-sheet", r.balanceSheet)
}

func parseBusinessID(q *http.Request) int {
	v := q.URL.Query().Get("business_id")
	if v == "" {
		return 1
	}
	n, err := strconv.Atoi(v)
	if err != nil || n <= 0 {
		return 1
	}
	return n
}

// --- Business ---

func (r *RESTFul) listBusiness(w http.ResponseWriter, req *http.Request) {
	list, err := r.businessSvc.List(req.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, list)
}

func (r *RESTFul) getBusiness(w http.ResponseWriter, req *http.Request) {
	id, err := strconv.Atoi(req.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	d, err := r.businessSvc.Get(req.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	r.json(w, d)
}

func (r *RESTFul) patchBusiness(w http.ResponseWriter, req *http.Request) {
	id, err := strconv.Atoi(req.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	var body business.Detail
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	body.ID = id
	if err := r.businessSvc.Update(req.Context(), &body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	d, _ := r.businessSvc.Get(req.Context(), id)
	r.json(w, d)
}

// --- Accounts ---

func (r *RESTFul) listAccounts(w http.ResponseWriter, req *http.Request) {
	bid := parseBusinessID(req)
	accounts, err := r.acctSvc.ListAccounts(req.Context(), bid)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, accounts)
}

func (r *RESTFul) getAccount(w http.ResponseWriter, req *http.Request) {
	id, err := strconv.Atoi(req.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	a, err := r.acctSvc.GetAccount(req.Context(), id)
	if err != nil {
		if errors.Is(err, acct.ErrNotFound) {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, a)
}

func (r *RESTFul) createAccount(w http.ResponseWriter, req *http.Request) {
	var detail acct.Detail
	if err := json.NewDecoder(req.Body).Decode(&detail); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if detail.BusinessID == 0 {
		detail.BusinessID = parseBusinessID(req)
	}
	if err := r.acctSvc.CreateAccount(req.Context(), &detail); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	r.json(w, detail)
}

// --- Journal ---

func (r *RESTFul) listEntries(w http.ResponseWriter, req *http.Request) {
	bid := parseBusinessID(req)
	entries, err := r.jnlSvc.ListEntries(req.Context(), bid)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, entries)
}

func (r *RESTFul) getEntry(w http.ResponseWriter, req *http.Request) {
	id, err := strconv.Atoi(req.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	e, err := r.jnlSvc.GetEntry(req.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	r.json(w, e)
}

func (r *RESTFul) postEntry(w http.ResponseWriter, req *http.Request) {
	var detail jnlentry.Detail
	if err := json.NewDecoder(req.Body).Decode(&detail); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if detail.BusinessID == 0 {
		detail.BusinessID = parseBusinessID(req)
	}
	if err := r.jnlSvc.PostEntry(req.Context(), &detail); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	r.json(w, detail)
}

// --- Periods ---

func (r *RESTFul) listPeriods(w http.ResponseWriter, req *http.Request) {
	bid := parseBusinessID(req)
	periods, err := r.periodSvc.ListPeriods(req.Context(), bid)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, periods)
}

type openPeriodRequest struct {
	BusinessID int       `json:"business_id"`
	Label      string    `json:"label"`
	Start      time.Time `json:"start"`
	End        time.Time `json:"end"`
}

func (r *RESTFul) openPeriod(w http.ResponseWriter, req *http.Request) {
	var opr openPeriodRequest
	if err := json.NewDecoder(req.Body).Decode(&opr); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if opr.BusinessID == 0 {
		opr.BusinessID = parseBusinessID(req)
	}
	p, err := r.periodSvc.OpenPeriod(req.Context(), opr.BusinessID, opr.Label, opr.Start, opr.End)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	r.json(w, p)
}

func (r *RESTFul) closePeriod(w http.ResponseWriter, req *http.Request) {
	id, err := strconv.Atoi(req.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	if err := r.periodSvc.ClosePeriod(req.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	p, err := r.periodSvc.GetPeriod(req.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, p)
}

// --- Reports ---

func (r *RESTFul) trialBalance(w http.ResponseWriter, req *http.Request) {
	bid := parseBusinessID(req)
	asOf, err := time.Parse(time.DateOnly, req.URL.Query().Get("as_of"))
	if err != nil {
		http.Error(w, "as_of required (YYYY-MM-DD)", http.StatusBadRequest)
		return
	}
	lines, err := r.reportSvc.TrialBalance(req.Context(), bid, asOf)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, lines)
}

func (r *RESTFul) incomeStatement(w http.ResponseWriter, req *http.Request) {
	bid := parseBusinessID(req)
	from, err := time.Parse(time.DateOnly, req.URL.Query().Get("from"))
	if err != nil {
		http.Error(w, "from required (YYYY-MM-DD)", http.StatusBadRequest)
		return
	}
	to, err := time.Parse(time.DateOnly, req.URL.Query().Get("to"))
	if err != nil {
		http.Error(w, "to required (YYYY-MM-DD)", http.StatusBadRequest)
		return
	}
	st, err := r.reportSvc.IncomeStatement(req.Context(), bid, from, to)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, st)
}

func (r *RESTFul) balanceSheet(w http.ResponseWriter, req *http.Request) {
	bid := parseBusinessID(req)
	asOf, err := time.Parse(time.DateOnly, req.URL.Query().Get("as_of"))
	if err != nil {
		http.Error(w, "as_of required (YYYY-MM-DD)", http.StatusBadRequest)
		return
	}
	bs, err := r.reportSvc.BalanceSheet(req.Context(), bid, asOf)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	r.json(w, bs)
}

func (r *RESTFul) json(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
