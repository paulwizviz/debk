package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"path"
	"path/filepath"
	"regexp"
	"runtime"
	"syscall"
	"time"

	"github.com/pressly/goose/v3"
	"github.com/spf13/viper"
	_ "modernc.org/sqlite"

	_ "debk/internal/dbmigrate" // Goose Go migrations (must load even when using `go run ./cmd/debk/main.go`)
	"debk/internal/domain/acct"
	"debk/internal/restserv"
	"debk/internal/webserver"
)

var (
	ErrConfig            = errors.New("config error")
	ErrUnsupportPlatform = errors.New("unsupported platform")
	ErrUnableToStartApp  = errors.New("unable to start application")
	ErrBadlyFormattedURL = errors.New("badly formatted url")
)

var (
	// Browser URL must match the listener host (127.0.0.1) so "localhost" does not resolve to IPv6 ::1 while the server is IPv4-only.
	localhostRegex = regexp.MustCompile(`^http://(127\.0\.0\.1|localhost):[0-9]{1,5}$`)
)

const (
	dbName    = "debk.db"
	dbPathKey = "database_path"
)

// location returns $HOME/.debk, where the config file and database will be stored.
func location() (string, error) {
	dir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("%w: unable to get home dir", ErrConfig)
	}
	return path.Join(dir, ".debk"), nil
}

func initConfig() error {
	appHome, err := location()
	if err != nil {
		return fmt.Errorf("%w: %w", ErrConfig, err)
	}

	if _, err := os.Stat(appHome); errors.Is(err, os.ErrNotExist) {
		if err := os.MkdirAll(appHome, 0755); err != nil {
			return fmt.Errorf("%w: %v", ErrConfig, err)
		}
	}

	viper.SetConfigName("debk")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(appHome)

	viper.SetDefault(dbPathKey, path.Join(appHome, dbName))

	if err := viper.ReadInConfig(); err != nil {
		var configFileNotFoundError viper.ConfigFileNotFoundError
		if errors.As(err, &configFileNotFoundError) {
			if err := viper.SafeWriteConfig(); err != nil {
				return fmt.Errorf("%w: error writing default config: %v", ErrConfig, err)
			}
		} else {
			return fmt.Errorf("%w: error reading config file: %v", ErrConfig, err)
		}
	}

	return nil
}

func createListener() (net.Listener, error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, fmt.Errorf("creating listener: %w", err)
	}
	return listener, nil
}

func getBrowserCommand(goos, rawUrl string) (string, []string, error) {
	if _, err := url.ParseRequestURI(rawUrl); err != nil {
		return "", nil, fmt.Errorf("%w: %w", ErrBadlyFormattedURL, err)
	}
	if !localhostRegex.MatchString(rawUrl) {
		return "", nil, fmt.Errorf("%w: not localhost", ErrBadlyFormattedURL)
	}
	switch goos {
	case "darwin":
		return "open", []string{rawUrl}, nil
	case "windows":
		return "rundll32", []string{"url.dll,FileProtocolHandler", rawUrl}, nil
	case "linux":
		return "xdg-open", []string{rawUrl}, nil
	default:
		return "", nil, fmt.Errorf("%w: support for Windows, Linux, macOS only", ErrUnsupportPlatform)
	}
}

func openBrowser(rawUrl string) error {
	goos := runtime.GOOS
	cmd, args, err := getBrowserCommand(goos, rawUrl)
	if err != nil {
		return err
	}
	if err := exec.Command(cmd, args...).Start(); err != nil {
		return fmt.Errorf("%w: %w", ErrUnableToStartApp, err)
	}
	return nil
}

func run(ctx context.Context) error {
	if err := initConfig(); err != nil {
		return fmt.Errorf("config: %w", err)
	}

	dbPath := viper.GetString(dbPathKey)
	dsn := sqliteDSN(dbPath)
	db, err := goose.OpenDBWithDriver("sqlite", dsn)
	if err != nil {
		return fmt.Errorf("opening db: %w", err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			slog.Error("failed to close database", "error", err)
		}
	}()

	if err := goose.RunContext(ctx, "up", db, "."); err != nil {
		return fmt.Errorf("migration: %w", err)
	}

	if err := bootstrapAccounts(ctx, db); err != nil {
		return fmt.Errorf("bootstrap: %w", err)
	}

	ln, err := createListener()
	if err != nil {
		return err
	}
	defer ln.Close()

	port := ln.Addr().(*net.TCPAddr).Port
	rawUrl := fmt.Sprintf("http://127.0.0.1:%d", port)

	mux := http.NewServeMux()
	mux = restserv.New(mux, db)
	mux = webserver.New(mux)

	srv := &http.Server{
		Handler: mux,
	}

	serverErr := make(chan error, 1)
	go func() {
		slog.Info("starting server", "url", rawUrl, "port", port)
		if err := srv.Serve(ln); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
		}
	}()

	go func() {
		time.Sleep(100 * time.Millisecond)
		if err := openBrowser(rawUrl); err != nil {
			slog.Warn("could not open browser", "error", err)
		}
	}()

	select {
	case <-ctx.Done():
		slog.Info("shutting down gracefully...")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		return srv.Shutdown(shutdownCtx)
	case err := <-serverErr:
		return fmt.Errorf("server error: %w", err)
	}
}

func sqliteDSN(path string) string {
	p := filepath.ToSlash(path)
	return "file:" + url.PathEscape(p) + "?_pragma=foreign_keys(1)"
}

func bootstrapAccounts(ctx context.Context, db *sql.DB) error {
	acctSvc := acct.NewService(acct.NewRepository(db))
	return acctSvc.EnsureRetainedEarnings(ctx, 1)
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := run(ctx); err != nil {
		slog.Error("application failed", "error", err)
		os.Exit(1)
	}
}
