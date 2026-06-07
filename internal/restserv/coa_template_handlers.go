package restserv

import (
	"errors"
	"net/http"

	"debk/internal/authz"
	"debk/internal/domain/acct"
)

// coaTemplateInfo is the public summary of a chart-of-accounts starter template.
type coaTemplateInfo struct {
	Key          string `json:"key"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	AccountCount int    `json:"account_count"`
}

// coaTemplatesResponse advertises the available templates and whether the chart
// is still empty enough to be pre-populated.
type coaTemplatesResponse struct {
	Available bool              `json:"available"`
	Templates []coaTemplateInfo `json:"templates"`
}

// listAccountTemplates returns the enterprise starter charts. Administrator-only
// (business:write), since pre-population belongs to application configuration.
func (r *RESTFul) listAccountTemplates(w http.ResponseWriter, req *http.Request) {
	if _, ok := r.guard(w, req, authz.PermBusinessWrite); !ok {
		return
	}
	bid := parseBusinessID(req)
	n, err := r.acctSvc.CountUserAccounts(req.Context(), bid)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	templates := acct.BuiltinTemplates()
	infos := make([]coaTemplateInfo, 0, len(templates))
	for _, t := range templates {
		infos = append(infos, coaTemplateInfo{
			Key:          t.Key,
			Name:         t.Name,
			Description:  t.Description,
			AccountCount: len(t.Accounts),
		})
	}
	r.json(w, coaTemplatesResponse{Available: n == 0, Templates: infos})
}

// applyAccountTemplate seeds an empty chart with the chosen template. It is a
// one-time bootstrap and is administrator-only (business:write). The seeded
// accounts can be extended afterwards via the normal chart-of-accounts screen.
func (r *RESTFul) applyAccountTemplate(w http.ResponseWriter, req *http.Request) {
	if _, ok := r.guard(w, req, authz.PermBusinessWrite); !ok {
		return
	}
	bid := parseBusinessID(req)
	key := req.PathValue("key")
	created, err := r.acctSvc.ApplyTemplate(req.Context(), bid, key)
	if err != nil {
		switch {
		case errors.Is(err, acct.ErrTemplateNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, acct.ErrTemplateUnavailable):
			http.Error(w, err.Error(), http.StatusConflict)
		default:
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
		return
	}
	r.json(w, created)
}
