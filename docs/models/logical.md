# Logical Data Model

The following diagram represents the logical structure of the bookkeeping core.

```mermaid
erDiagram
    business ||--o{ acct : "owns"
    business ||--o{ period : "defines"
    business ||--o{ jnlentry : "records"
    acct ||--o{ jnline : "summarised in"
    jnlentry ||--|{ jnline : "composed of"
    acctype ||--o{ acct : "categorises"
    period ||--o{ jnlentry : "bounds"

    business {
        string id
        string legal_name
        string functional_currency
    }

    acct {
        string id
        string business_id
        string code
        string name
        acctype type
        boolean is_temporary
        boolean is_contra
    }

    period {
        string id
        string business_id
        date start_date
        date end_date
        string label
    }

    jnlentry {
        string id
        string business_id
        string period_id
        int journal_seq
        date entry_date
        datetime created_at
        datetime posted_at
        string description
        string reference
        string entry_kind
        boolean is_closing
    }

    jnline {
        string id
        string jnlentry_id
        string acct_id
        decimal amount
        string side
    }
```

**Field notes:** `journal_seq` is a monotonic per-`business` sequence for stable audit ordering (in addition to `entry_date`). `entry_kind` distinguishes **normal**, **adjusting**, and **closing** entries to mirror the accounting cycle. `is_temporary` on `acct` is true for Revenue, Expense, and Dividends/Drawings. `is_contra` marks contra-asset (and similar) accounts stored with base type Asset. Each `jnline` has a positive `amount` on exactly one `side` (Debit or Credit).

## Identity (IAM) — logical addendum

Bookkeeping entities above are scoped by **`business`**. **Operators** (human principals) authenticate into the app; their membership and **roles** are stored separately from ledger `acct` rows.

```mermaid
erDiagram
    business ||--o{ operator : "scopes"
    operator ||--o{ operator_role : "has"
    operator ||--o{ session : "opens"

    operator {
        int id
        int business_id
        string login
        string display_name
        string status
        string password_hash
    }

    operator_role {
        int operator_id
        string role
    }

    session {
        string id
        int operator_id
        datetime expires_at
    }
```

- **`operator`:** Unique **login** per `business_id`; **password_hash** at rest; **status** active/disabled.
- **`operator_role`:** One row per assigned role (`admin`, `user`); effective permissions are the **union** of role bundles (`internal/authz/authz.go`).
- **`session`:** Opaque session id bound to `operator_id` with expiry; issued to the browser as an HTTP-only cookie for authenticated API calls.

Physical table and column names in SQLite follow `internal/dbmigrate` and `internal/domain/operator` / `session`.
