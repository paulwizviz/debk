package webserver

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAssetsServedNotSPA404(t *testing.T) {
	mux := http.NewServeMux()
	mux = New(mux)

	for _, path := range []string{"/assets/", "/assets/main-05e79872.js"} {
		t.Run(path, func(t *testing.T) {
			rec := httptest.NewRecorder()
			mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
			if rec.Code == http.StatusNotFound {
				t.Fatalf("%s: got 404 (JS bundle would fail to load → blank page)", path)
			}
		})
	}
}
