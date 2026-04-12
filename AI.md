# DEBK: AI assistant guidance

This file defines the high-level workflow and operational mandates for the DEBK repository.

## 1. Core mandates

- **Language:** All documentation and comments must use British English. The only exception is coding names following US English conventions.
- **Domain expertise:** You are an expert in:
  - Bookkeeping and accounting principles; ensure domain descriptions remain accurate.
  - Software engineering: analyse the domain and implement it in **Go**, **SQL**, and **Web** (HTML, JavaScript, React).

## 2. Project layout

```text
/docs                 — Markdown documentation (concept, model, user-guide, …)
/docs/images/         — Illustrations; user-guide screenshots under user-guide/
/cmd/debk             — Main application entrypoint (local HTTP server + embedded UI)
/internal
  /dbmigrate          — Goose Go migrations (registered via blank import from cmd/debk)
  /domain             — DDD-style domain packages (acct, period, jnlentry, …)
  /restserv           — HTTP API handlers
  /webserver          — Embedded Vite build (go:embed public/)
/web                  — React (Vite) source
/build/debk           — Docker builder image and debknative.sh cross-build script
/scripts              — debk.sh orchestration (web build + Docker)
```

All markdown documentation lives under `/docs`.

Go code lives under `/cmd` and `/internal`. The React application source is under `/web`.

## 3. Context registry

### Project scope

Refer to `./docs/concept.md` to understand the scope of the project.

### Modelling

Use the following techniques to generate models:

- **DDD components:** Extract terms from the domain and classify as **bounded context**, **domain events**, **entities**, and **value objects**.
- **Semantic data modelling:** Focus on entity relationships in the business domain.
- **Use case analysis:** Identify personas and user stories; map information flow from UI to backend services.
- **Design thinking:** Apply design thinking to use case analysis to inform web screens.

### Coding standards

#### Go

- Follow [Effective Go](https://go.dev/doc/effective_go) for idiomatic programming.
- Error handling: wrap errors with context using `%w`.
- Include `context.Context` for cancellation where appropriate.
- Include a `doc.go` file and Go doc in packages, with a header such as `// Package <name> …`.
- **DDD to package mapping:** Each DDD entity or logical component (e.g. `acct`, `fintxn`) maps to its own Go package under `internal/domain/…`.
- **Naming stuttering:** Avoid redundant naming within a package (e.g. `acct.Detail`, not `acct.Account`).
- **Package layout:** Prefer a file named after the package (e.g. `acct.go` for `package acct`) for constants, interfaces, and core types; split implementations and services into additional files.

**Executable:** The desktop-style app is `cmd/debk`: it opens a **local HTTP listener** on `127.0.0.1` (ephemeral port), runs database migrations, serves the **REST API** and **embedded SPA**, and attempts to open the system browser.

**Migrations:** Goose **Go** migrations live in `internal/dbmigrate`. They register in `init()` functions. `cmd/debk/main.go` must include a **blank import** `_ "debk/internal/dbmigrate"` so that `go run ./cmd/debk/main.go` (single file) still links those `init()` handlers. SQL migrations on disk are not required if all steps are expressed in Go.

Under `/cmd/debk`, keep the `main` package for the executable.

Under `/internal/domain`, keep packages for DDD components.

#### SQL

- **SQLite:** Principal database (via `modernc.org/sqlite` in this project).
- **SQL conventions:** Prefer portable ideas where practical; implementation targets SQLite.
- **Schema in Go:** Table and column names as `const`; build `CREATE TABLE` by concatenating those constants where this pattern is used.
- **Migrations:** Goose drives schema changes; register migrations in `internal/dbmigrate`.

## 4. Output standard

The project uses Go, SQL, and JavaScript/React.

### Markdown documentation

Markdown is the main format. Follow [CommonMark](https://spec.commonmark.org/0.31.2/) where practical.

### End-user documentation

- **`docs/user-guide.md`:** Standalone user guide (non-technical tone, worked examples). It references screenshots under `docs/images/user-guide/*.png` when present.
- **Refreshing screenshots:** From `web/`, after `npm run build` and with DEBK running, use `DEBK_BASE_URL=<app URL> npm run capture-user-guide-screens` (Playwright script in `web/scripts/capture-user-guide-screens.mjs`). Requires `npx playwright install chromium` once per environment.

### DDD, data, and use case models

- **DDD components:** Short canonical names for business terms (e.g. `fintxn` for financial transaction). Define terms to disambiguate accounting “account” from technical “account”.
- **Logical data models:** Prefer logical structures; avoid over-specifying physical keys or SQL types in domain docs unless necessary.
- **Use cases:** Personas with names and profiles; user stories with acceptance criteria; sequence diagrams from UI to services.

Use Mermaid for ER, sequence, and class diagrams where diagrams add value ([Mermaid syntax](https://mermaid.ai/)).

### Web

Refer to use cases in `/docs/model.md` for screen scope. Use **JavaScript**, **React**, and **Material-UI** only. **Do not** use TypeScript.

- **Frontend source:** `/web`.
- **Build:** Vite; production output is written to **`internal/webserver/public`** (`web/vite.config.js`).
- **Serving:** `internal/webserver` uses **`//go:embed all:public`** and `webserver.New(mux)` to register static routes and SPA fallback alongside the API on the same `http.ServeMux`.
- **React:** Follow [pillarstudio reactjs guidelines](https://github.com/pillarstudio/standards/blob/master/reactjs-guidelines.md) when generating React code.
- **Material-UI:** Follow [Material-UI cursor guidance](https://cursorrules.org/article/material-ui-cursor-mdc-file) when using MUI.

### Build and release process

- **Local development:** `cd web && npm run build`, then `go run ./cmd/debk` (or `go run ./cmd/debk/main.go` with the `dbmigrate` blank import present in `main.go`).
- **Scripted build (`scripts/debk.sh build`):** Runs `npm install` and `npm run build` in `web/`, then `docker compose` using `build/debk/builder.yaml` to build the image and run the container once. The container executes `build/debk/debknative.sh`, which **cross-compiles** with **`CGO_ENABLED=0`** for **darwin/amd64**, **linux/amd64**, and **windows/amd64**, outputting into **`./build/package/...`** inside the container. The compose file mounts the host **`package`** directory (resolved from the shell’s current working directory when compose runs—typically the repo root when invoked from `scripts/debk.sh`) to `/opt/build/package`, so binaries appear under **`package/macOS/`**, **`package/linux/`**, **`package/windows/`** on the host.
- **Docker image (`build/debk/debk.dockerfile`):** Go toolchain image; copies `go.mod`, `go.sum`, `cmd/`, and `internal/`; runs `go mod download`. The **embedded UI** must already exist under `internal/webserver/public` on the host before the image build context is captured (the scripted build runs the web build first).
- **Cleanup (`scripts/debk.sh clean`):** Removes the **`package/`** directory if present and clears **`internal/webserver/public/*`**.

## 5. Execution rules

- **Research:** Analyse `/docs/concept.md` for project scope. **Do not** use `README.md` as the primary scope document unless explicitly asked.
- **Strategise:** Propose a plan grounded in the context registry before large changes.
- **Modelling:** When generating or updating models, align with `/docs/model.md` and scope; note observations and seek approval when the workflow requires it.
- **Generate code:** After agreed models, implement Go, SQL (as applicable), and web code consistently with this file.
- **Manual interventions:** If documentation or code was hand-edited, treat those edits as patterns to follow unless asked to replace them.
- **Approval:** Ask for approval before broad or risky changes when the user expects it.

When asked to generate full artefacts end-to-end, prefer the sequence **Research → Modelling → Generate code**, with checkpoints for approval where appropriate. Partial re-generation of a single phase is normal.

Artefacts may be extended or corrected manually; respect the **manual interventions** rule and ask for approval when instructions require it.
