# Web Interface Design

## Use case ↔ UI matrix

| Use case | UI surface(s) | Notes |
| :--- | :--- | :--- |
| 1a. Installation & user administration | **Installer / first-run** + **Identity & access** (`/identity`) | Alice (**Administrator**): bootstrap, create `business`, manage operators and access types. Shown from the **home portal** when `user:read`, `user:write`, or `user:invite` applies. Enforce permission checks on every mutating API. |
| 1a*. Legal entity & currency | **Configuration** (`/configure`) | **Business profile** (legal name, functional currency) for principals with `business:write` (**Administrator** operators). **User** operators do not reach it. |
| 1b. Chart of accounts & opening structure | **Chart of accounts** (`/books/accounts`) under **Bookkeeping** | COA add/edit (`acct` metadata) for operators with `coa:write`. Both **Administrator** and **User** (bookkeeper) operators reach it. |
| 2. Internal treasury movement | **Journal workbench** (`/books/workbench`) | Same multi-line posting flow as other entries; optional quick labels (e.g. "Internal transfer") for narrative only. |
| 3. Turnover (credit/cash) | **Journal workbench** | Balancing + account picker; no separate screen required unless templates are added later. |
| 4. Complex split (payroll) | **Journal workbench** | Three+ lines; difference-to-zero gate matches acceptance criteria. |
| 5. Adjusting (depreciation) | **Journal workbench** | User sets **`entry_kind` = adjusting** (or equivalent) so reports and audit lists can filter non-routine entries. Contra asset accounts appear in pickers when type = Asset + `is_contra`. |
| 6. Closing the books | **Periods** (`/books/periods`) under **Bookkeeping** + **Closing assistant** | Select **accounting period** (or financial year end); review computed net activity on temporary accounts; confirm generation of **closing** `jnlentry` rows to retained earnings. Not a free-form manual line-by-line task unless advanced mode is explicitly offered. |
| — (cross-cutting) | **Financial Pulse** (`/books`), **Journal audit** (`/books/journal`), **Chart of accounts** (`/books/accounts`), **Periods** (`/books/periods`), **Reports** (`/books/reports`), **Account ledger** (`/books/ledger/account/:id`) | Grouped under **Bookkeeping** when `journal:read`, `journal:write`, or `report:read` applies. |

**Gaps addressed in this document:** installation and **user/role** administration (1a), **COA** onboarding (1b), explicit **period** context (6), **entry_kind** in the workbench (5), a dedicated **closing** flow (6), and alignment with **immutability** (see **Recent activity** under Dashboard).

## Post-login home portal (role hub)

After a successful session is established, the default route **`/`** is a **home portal**: up to **three** large entry tiles. Each tile is **omitted** unless the operator’s effective permissions include the corresponding capability (evaluated in the SPA from the same role→permission map as the server; see `internal/authz/authz.go`).

| Tile | Shown when (permission union) | Primary route | Purpose |
| :--- | :--- | :--- | :--- |
| **Identity & access** | `user:read` **or** `user:write` **or** `user:invite` | `/identity` | Operator directory, add user, access type, passwords, enable/disable (**Administrators** only in the baseline product). |
| **Configuration** | `business:write` | `/configure` | **Business profile only** — legal entity and functional currency (**Administrator** operators). |
| **Bookkeeping** | `journal:read` **or** `journal:write` **or** `report:read` | `/books` (nested layout) | Financial pulse, journal audit, workbench, chart of accounts, periods, reports, account ledger—see **Bookkeeping layout** below. |

- **App chrome:** A top **AppBar** with **Home** (returns to `/`, hidden when already on `/`) and **Sign out**. There is **no** global navigation drawer on the hub; navigation is **scoped per area**.
- **Chart of accounts:** Operators with `coa:write` (Administrator and User/bookkeeper) maintain the COA from **Bookkeeping → Chart of accounts** (`/books/accounts`).

**Redirects (compatibility):** `/settings/users` → `/identity`; `/setup` → `/books/accounts`; `/business` → `/configure`; legacy `/journal`, `/workbench`, `/periods`, `/reports`, `/ledger/...` → equivalent paths under **`/books/...`**.

## Administration and configuration panels

Use cases **1a** and **1b** use **dedicated routes** from the hub above. Operators use the **same** DEBK instance on the **same platform** (`requirements.md`); surfaces are **role-gated** (`system.md`).

### Identity & access (use case 1a)

- **Audience:** Principals with **identity** permissions (**Administrator** access: full operator lifecycle).
- **Purpose:** Create and manage **operator** accounts bound to the current **`business`**: onboard colleagues, assign **roles**, and control lifecycle.
- **Content:**
  - **Directory table:** display name, login identifier, **assigned roles** (badges), **status** (active / disabled), optional last sign-in.
  - **Primary actions:** **Add user** (wizard or modal: login, display name, initial role assignment, optional invite copy); **Edit roles**; **Disable** / **re-enable**; **Reset password** (admin-mediated flow for local deployment—no email dependency).
- **UX:** Inline validation; confirm destructive actions; clear empty state when only the bootstrap administrator exists; surface **403** from the API as human-readable “you are not allowed to change this.”

### Configuration — business profile (use case 1a*)

- **Audience:** Principals with **`business:write`** (**Administrator** operators).
- **Purpose:** Maintain the **business** **legal name** and **functional currency** at **`/configure`**.
- **Pre-populate chart of accounts:** From the same screen administrators can seed a starter chart from an enterprise template (**Professional services**, **Retail**, **E-commerce**, **Manufacturing**). This is **administrator-only** (`business:write`) and a **one-time bootstrap** — the options are offered only while the chart is empty (Retained Earnings aside) and disappear once a template is applied. Seeded accounts are ordinary `acct` rows that are then **extended under Bookkeeping → Chart of accounts**.
  - API: `GET /api/accounts/templates` (lists templates and an `available` flag); `POST /api/accounts/templates/{key}` (applies; `409` if the chart is already populated, `404` for an unknown key).
- **Chart of accounts (editing)** is **not** part of this screen; it lives under **Bookkeeping → Chart of accounts** (`/books/accounts`) for operators with **`coa:write`**.

### Chart of accounts (use case 1b)

- **Audience:** Principals with **`coa:write`** (**Administrator** and **User/bookkeeper** operators).
- **Route:** **`/books/accounts`** within the bookkeeping layout.
- **Purpose:** Maintain **`acct`** rows: **`acctype`**, **`is_temporary`**, **`is_contra`**; validation errors inline; explicit confirmation when the system **auto-provisions retained earnings**.

## Bookkeeping layout

Under **`/books`**, a **persistent drawer** (on wide viewports) lists only bookkeeping surfaces:

| Label | Route |
| :--- | :--- |
| Overview | `/books` |
| Journal | `/books/journal` |
| Chart of accounts | `/books/accounts` |
| Periods | `/books/periods` |
| Reports | `/books/reports` |

Account ledger drill-downs use **`/books/ledger/account/:id`**. Narrow viewports use a **menu** control to open the same list temporarily.

## Dashboard (financial pulse)

- **Context bar:** Active **`business`** name and **functional currency**; **period** or date range selector driving charts and roll-ups where applicable.
- **Top row:** Real-time balances for assets, liabilities, and equity (trial-balance-derived).
- **Middle row:** Turnover vs. operating expenses trend for the selected range (profit and loss account trend).
- **Bottom row — Recent activity:** Chronological list of posted `jnlentry` rows with **View** (detail + lines). **No in-place edit** of posted entries (see mapping rules: corrections are new entries). Offer **Correct** / **Reverse** that opens the workbench pre-filled with a reversing pattern, or link to documentation.

## Journal workbench

- **Route:** `/books/workbench` (within the bookkeeping layout).
- Dedicated flow for **multi-line** `jnline` rows (covers treasury moves, credit sales, payroll, depreciation).
- **Dynamic balancing:** Debit/credit totals and a **difference** indicator; **Post** enabled only when difference is zero; server-side validation remains mandatory.
- **Entry metadata:** **`entry_date`**, **description**, **reference** (source document), and **`entry_kind`**: at least **normal** and **adjusting** for user-authored posts; **closing** is usually created by the **Closing assistant** (see **Periods & closing assistant** below) rather than typed manually.
- **Account suggestions:** Filter by code/name and by **`acctype`**; respect **`is_contra`** in labels (e.g. "Accum. depreciation (contra asset)").

## General ledger & journal (audit trail)

- **Journal view:** Full **chronological** list of all `jnlentry` rows (filter by date range, `entry_kind`, text search). Satisfies the domain expectation of a complete audit trail, not only "recent" widgets.
- **Account ledger (`genledger`):** Running balance for one `acct` with drill-down from reports (§4.6) and from the COA manager.

## Periods & closing assistant

- **Period management:** Define **accounting periods** (`period`: label, start/end) bound to the `business`; postings associate with a period (or derive period from `entry_date` with explicit rules—either way the UI must make the active period obvious for closing).
- **Closing assistant (use case 6):** Stepwise UI: choose period → show **temporary** account balances (revenue, expense, dividends/drawings) → preview **closing** journal entries → confirm. After close, temporary accounts show **zero** opening for the next period in ledger views.

## Financial statements & trial balance (operator view)

- **Access:** Surfaces in this subsection are used by **Charlene** (**User**) for routine production of reports; **Alice** (**Administrator**) may also open them.
- **Profit and loss account:** Turnover, operating expenses, and **dividends or drawings** (when present) for the selected period; **profit for the period** footer consistent with closing logic.
- **Balance sheet:** As of date; **current** and **tangible fixed** assets; **contra assets** netted against related assets so **carrying amount** matches use case 5 (e.g. office equipment less accumulated depreciation).
- **Trial balance:** List all `acct` with debit/credit columns and totals (debits = credits). Supports validation mindset from `domain.md`.
- **Drill-down:** Amounts on the profit and loss account, balance sheet, and trial balance open **account ledger** or filtered **journal** for the same period/as-of context.
