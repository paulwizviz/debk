package webserver

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed all:public
var web embed.FS

func homeHandler(rw http.ResponseWriter, r *http.Request) {
	index, err := web.ReadFile("public/index.html")
	if err != nil {
		http.Error(rw, "Not Found", http.StatusNotFound)
		return
	}
	rw.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = rw.Write(index)
}

func spaFallback(w http.ResponseWriter, r *http.Request) {
	rest := strings.Trim(r.PathValue("path"), "/")
	if strings.HasPrefix(rest, "api/") {
		http.NotFound(w, r)
		return
	}
	if strings.HasPrefix(rest, "assets/") {
		http.NotFound(w, r)
		return
	}
	homeHandler(w, r)
}

func New(mux *http.ServeMux) *http.ServeMux {
	publicFS, _ := fs.Sub(web, "public")
	mux.Handle("GET /assets/", http.FileServer(http.FS(publicFS)))
	mux.HandleFunc("GET /{$}", homeHandler)
	mux.HandleFunc("GET /{path...}", spaFallback)
	mux.HandleFunc("GET /vite.svg", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFileFS(w, r, publicFS, "vite.svg")
	})
	return mux
}
