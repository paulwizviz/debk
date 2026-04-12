// Package dbmigrate registers Goose SQL migrations as Go functions.
// It is imported for side effects from cmd/debk so that
// `go run ./cmd/debk/main.go` still links migration init() functions
// (running only main.go does not compile other files in cmd/debk).
package dbmigrate
