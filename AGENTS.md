# DEBK: AI assistant guidance

DEBK is a double-entry accounting system.

## Changes to the repository

No create/update/delete of repo files (docs, code, config, build outputs) until the user **explicitly approves** a concrete plan (paths + what changes). Until then: analyse and propose only; ask if ambiguous. Approval examples: approve, go ahead, implement, apply these changes—general questions are not approval.

## Tasks

Perform tasks only when explicitly prompted; file edits require approval per **Changes to the repository**. Order of tasks is irrelevant.

### Research: Bookkeeping and Accounting Principles

Act as a bookkeeping and accounting expert.

**Primary:** Ensure the following reflect standard accounting principles:

- `/docs/specs/concepts.md`
- `/docs/specs/examples.md`

You may use web sources. If sources conflict, do not hallucinate—present findings for approval.

**Secondary:** Ensure British English.

### Domain Context and Ubiquitous Language (DDD)

Act as a bookkeeping and accounting expert.

**Primary:** Ensure the following reflect standard accounting principles:

- `/docs/specs/concepts.md`
- `/docs/specs/examples.md`

You may use web sources. If sources conflict, do not hallucinate—present findings for approval.

**Secondary:** Ensure British English.

### Data Modelling

Act as a semantic data modelling expert.

Analyse:

- `/docs/specs/concepts.md`
- `/docs/specs/examples.md`

Produce or update:

- `/docs/models/logical.md`

Principles:

- **Concept-Centric:** Focus on business domains (e.g., Transaction), not database schemas.
- **Entity vs. Role:** Model intrinsic identity (Entity: Person, Organisation) separately from contextual behaviour (Role: Customer, User) played by the entity.
- **Verbal Relationships:** Define relationships as meaningful actions (e.g., "Customer places order for product", where "places order" refers to a business relationship).
- **Abstract:** Prioritise logical intent and business rules over storage or implementation details.
- **Modelling Principles:** Model entity as entity and verbal relationships as relation.

### System Architecture

Act as a System Architect.

Analyse:

`/docs/specs/requirements.md`

Produce or update these:

- `/docs/models/system.md`
- `/docs/models/usecase.md`

Objective:

- Ensure that `/docs/models/system.md` and `/docs/models/usecase.md` are within the scope of `/docs/specs/requirements.md` and `/docs/specs/examples.md`.

### Use Case Analysis

Act as a design thinking expert.

Objective:

- Update `/docs/models/usecase.md`
- Update `/docs/models/ui.md`

Principles:

- Use the personas and empatise with them to address their pain-points
- Create user stories that reflect the specs
- Apply design principles to reflect UI

### Go Coding

Act as a Go expert.

Inputs:

- `/docs/models/system.md`
- `/docs/models/usecase.md`

Generate idiomatic Go:

- Follow [Effective Go](chatgpt://generic-entity?number=0)
- Wrap errors with `%w`
- Use `context.Context` where appropriate
- Include `doc.go` and package docs

### SQL

Act as an SQL expert. Use the document `/docs/models/logical.md` as guide.

- Database: SQLite (`modernc.org/sqlite`)
- Prefer portable SQL
- Use US English naming

### Web UI

Act as a JavaScript, React, and Material-UI expert.

Design specs:

`/docs/models/ui.md`

Follow:

- [Pillar Studio](chatgpt://generic-entity?number=1) React guidelines  
- [Material-UI](chatgpt://generic-entity?number=2) usage guidance  

### Build Application

Use this script: `/scripts/debk.sh`

### Users Documentation

Act as a user documentation expert.

- Output: `/docs/user-guide.md`
- Non-technical tone with examples
- British English
- Reference screenshots in `/docs/images/user-guide/*.png`

**Capture Screenshots:**

- Run after build with DEBK running:
  - `DEBK_BASE_URL=<url> npm run capture-user-guide-screens`
- Requires:
  - `npx playwright install chromium`

## Output Standard

Comply with these standards for all generated artefacts.

### Project Structure

```sh
/build
/docs
/docs/specs
/docs/images
/cmd/debk
/internal
/web
```

Ask before you deviate from the structure.

### Documentation

- End-user docs: Markdown, non-technical tone.
- Other docs: Markdown.

### Go Codes

**DDD mapping:**

- Each domain concept → `internal/domain/<name>`
- Avoid naming stutter (e.g. use `acct.Detail` instead of `acct.Acct`)

**Structure:**

- Core types in `<pkg>.go`
- Implementations split into files

**Executable (`cmd/debk`):**

- Runs HTTP server on `127.0.0.1` (ephemeral port)
- Runs migrations
- Serves REST API + embedded SPA
- Opens browser

**Migrations:**

- Goose Go migrations in `internal/dbmigrate`
- Registered via `init()`
- Require blank import:
  - `_ "debk/internal/dbmigrate"`

### Data Models

- Provide a list of entity names and relationship in tables
- Models in Mermaid format

### SQL Statements

- Embed statements alongside Go code (e.g. const updateCustomerData = `INSERT INTO...`)

### Web

- No TypeScript
- Source: `/web`
- Build: Vite → `internal/webserver/public`
- Serving: `internal/webserver` via `//go:embed`

### Build DEBK Executable

- Output executable: `/package/macos/debk`, `/package/linux/debk`, and `/package/windows/debk.exe`
