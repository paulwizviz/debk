# Use Case Analysis

## Personas

ACME Private Limited is a hypothetical **UK small manufacturing** company (bespoke **3D-printed** parts; principal **plant** is **printers**, **factory fit-out**, and **office equipment**; **two** shop-floor operators on payroll). Three personas show how **installation**, **user administration**, **application configuration**, and **bookkeeping** map to capabilities in DEBK.

### Assumption: one deployment, one platform

**Alice, Bob, and Charlene** are modelled as **different people using the same DEBK installation** on the **same platform** (typically **one host**: one running **process**, one **local SQLite** database, one **`business`**). They each sign in as a separate **operator** with **different roles**; they are **not** each running an isolated copy of the app against separate servers, and the product is **not treated as distributed** (no cluster of DEBK nodes, no multi-region ledger replication in scope). How they open the UI in practice (e.g. separate browser profiles on one PC, or another device reaching the same loopback-bound server) is an implementation detail; the use case assumes **one shared application and one shared ledger**.

### Alice — founder and system owner

**Profile:** Founding shareholder of ACME. She wants a standalone tool with strong privacy and the same mechanical rigour as professional double-entry bookkeeping.

**Responsibilities:**

- **Installs** DEBK on ACME’s machine (local execution per `requirements.md`).
- Holds **full administrative rights**, including **adding and managing users** and assigning their access (e.g. who may configure the product vs who may post to the ledger).
- May use any feature her role allows; the stories below assume she delegates routine configuration and posting to Bob and Charlene.

### Bob — CFO and configuration administrator

**Profile:** Chief Financial Officer and founding shareholder. He defines how ACME’s books are structured and reported internally.

**Responsibilities:**

- Holds **administrative rights** to **configure the application** for ACME—notably the **Chart of Accounts (COA)** and related account metadata (`acctype`, temporary vs permanent, contra flags) so the ledger reflects ACME’s operations.
- May **maintain legal entity and functional currency** where the product grants `business:write` to his role (same operator model as in `system.md` / `internal/authz`).
- May **invite or manage bookkeeper-only** colleagues (e.g. Charlene) when the product grants `user:invite`; **full** user lifecycle (e.g. assigning another full administrator) stays with Alice unless policy changes.
- May **post journal entries** and use bookkeeping surfaces (same deployment) when his role includes `journal:write` (implementation: **configuration administrator** role in code).
- Typically reviews outputs before management use; statutory **sign-off** remains outside the software (see `requirements.md`).

### Charlene — bookkeeper

**Profile:** Operates the ledger day to day and produces management information.

**Responsibilities:**

- **Bookkeeping rights:** record **journal entries** (including multi-line splits), subject to validation (balanced debits and credits, valid accounts).
- **Produce financial statements** and supporting views (profit and loss account, balance sheet, trial balance, journal and account ledgers) for periods she is responsible for.

## User stories

- **System installation and user administration:**
  - **Primary actor:** Alice.
  - **Story:** Alice installs DEBK, creates ACME’s **business** identity, and adds **Bob** and **Charlene** with the correct access (Bob: configuration administrator; Charlene: bookkeeper).
  - **Acceptance criteria:**
    - Installation completes per product packaging; core operation remains **local** with no mandatory cloud dependency.
    - Alice persists a `business` row (`legal_name`, `functional_currency`) as the isolation root for all ledger data.
    - Alice can create **user accounts** bound to that business and assign **distinct capabilities**: at minimum **full administration** (install lifecycle and **user** lifecycle), **application configuration including COA** (Bob), and **posting plus financial reporting** (Charlene).
    - The system **denies** operations outside the signed-in user’s effective permissions (e.g. Charlene cannot add users or alter COA structure if policy forbids it; Bob cannot remove Alice’s ownership if the product reserves that).

- **Chart of accounts and opening structure:**
  - **Primary actor:** Bob.
  - **Story:** Bob establishes ACME’s initial **COA** and opening `acct` rows so Charlene can post against a coherent structure.
  - **Acceptance criteria:**
    - Bob defines starting `acct` records (e.g. bank current account (EFG), share capital, **plant & machinery (3D printers)**, **leasehold improvements – factory**, **office equipment**, payroll control accounts) aligned with `examples.md` / `domain.md`.
    - The system ensures a **retained earnings** equity account exists (create if absent) for future closing and the **balance sheet**.
    - The system validates that the initial `coa` is correctly categorised by `acctype`.

- **Internal treasury movement (bank to petty cash):**
  - **Primary actor:** Charlene.
  - **Story:** Charlene records a £200 transfer from the business bank account to petty cash.
  - **Acceptance criteria:**
    - The system records a £200 debit to "Petty cash" and a £200 credit to "Bank current account (EFG)."
    - Total assets remain unchanged, but the composition is updated.

- **Turnover recognition (credit):**
  - **Primary actor:** Charlene.
  - **Story:** Charlene records a credit sale of **manufactured parts** to **Northern Components Ltd** on 30-day terms (per ACME’s source documents).
  - **Acceptance criteria:**
    - A `jnlentry` is recorded with a £2,500 debit to "Trade debtors" and a £2,500 credit to "Turnover."
    - The system correctly identifies "Trade debtors" as an asset and "Turnover" as revenue (income).

- **Complex split entry (payroll):**
  - **Primary actor:** Charlene.
  - **Story:** Charlene records April payroll for ACME’s **two production operators**—**Dana** and **Ellis**—each as a separate balanced `jnlentry`, with PAYE and NICs on simplified control accounts (see `examples.md`).
  - **Acceptance criteria:**
    - For **each** pay run, one `jnlentry` with three `jnline` records: debit **Staff costs** (gross), credit **Bank** (net pay), credit **PAYE and NICs payable** (withholdings).
    - Dana: gross £1,000 / net £900 / withheld £100. Ellis: gross £950 / net £855 / withheld £95.
    - The system rejects any `jnlentry` whose lines do not balance.

- **Asset depreciation (adjusting entry):**
  - **Primary actor:** Charlene.
  - **Story:** Charlene records period depreciation on **plant and equipment** (office, printers, and factory fit-out—see `examples.md` for the simplified single charge).
  - **Acceptance criteria:**
    - Debit: Depreciation (expense).
    - Credit: Accumulated depreciation (contra-asset).
    - The **balance sheet** shows **carrying amount** for each tangible line (or net block) **net of** accumulated depreciation, consistent with posted lines.

- **Closing the books:**
  - **Primary actor:** Charlene (Bob may review totals before confirm, per ACME policy).
  - **Story:** At year-end, Charlene runs the closing process so temporary accounts (revenue, expense, and any dividends or drawings) reset to zero.
  - **Acceptance criteria:**
    - The system calculates the net activity of all **temporary** `acct` rows (`is_temporary = true`), including **dividends or drawings** where used.
    - Closing `jnlentry` rows use `entry_kind = closing` (or equivalent) and transfer **profit for the period** and dividends (or drawings) effects to **retained earnings** (equity), consistent with `domain.md`.
    - All revenue, expense, and dividends/drawings accounts begin the next `period` with a zero balance; permanent accounts carry forward.
