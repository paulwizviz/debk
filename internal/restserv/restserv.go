package restserv

import (
	"database/sql"
	"net/http"
)

type RESTFul struct {
	db *sql.DB
}

func New(mux *http.ServeMux, db *sql.DB) *http.ServeMux {
	return mux
}
