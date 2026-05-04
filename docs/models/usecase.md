# Use Case Analysis

## Personas

ACME Private Limited is a hypothetical **UK small manufacturing** company (bespoke **3D-printed** parts; principal **plant** is **printers**, **factory fit-out**, and **office equipment**; **two** shop-floor operators on payroll). Two **access types**—**Administrator** and **User**—show how **installation**, **user administration**, **application configuration**, and **bookkeeping** map to capabilities in DEBK.

### Assumption: one deployment, one platform

**Alice and Charlene** are modelled as **different people using the same DEBK installation** on the **same platform** (typically **one host**: one running **process**, one **local SQLite** database, one **`business`**). They each sign in as a separate **operator** with **different roles**; they are **not** each running an isolated copy of the app against separate servers, and the product is **not treated as distributed** (no cluster of DEBK nodes, no multi-region ledger replication in scope). How they open the UI in practice (e.g. separate browser profiles on one PC, or another device reaching the same loopback-bound server) is an implementation detail; the use case assumes **one shared application and one shared ledger**.

### Alice — Administrator

**Profile:** Founding shareholder of ACME. She wants a standalone tool with strong privacy and the same mechanical rigour as professional double-entry bookkeeping.

**Responsibilities (Administrator role):**

- **Installs** DEBK on ACME’s machine (local execution per `requirements.md`).
- **Identity management:** create and manage operators, assign **Administrator** or **User** access, reset passwords, enable or disable sign-in.
- **Configuration:** maintain the **chart of accounts** and related account metadata (`acctype`, temporary vs permanent, contra flags), and **legal entity & functional currency** where the product grants `business:write`.
- **Bookkeeping:** may post journals and use all bookkeeping surfaces (same deployment) with `journal:write` and related permissions.
- May delegate day-to-day posting to Charlene while retaining oversight; statutory **sign-off** remains outside the software (see `requirements.md`).

### Charlene — User

**Profile:** Operates the ledger day to day and produces management information.

**Responsibilities (User role):**

- **Bookkeeping only:** record **journal entries** (including multi-line splits), subject to validation (balanced debits and credits, valid accounts).
- **Produce financial statements** and supporting views (profit and loss account, balance sheet, trial balance, journal and account ledgers) for periods she is responsible for.
- **Cannot** change the chart of accounts, business profile, or other operators’ accounts (enforced at the API).

## User stories

- **System installation and user administration:**
  - **Primary actor:** Alice.
  - **Story:** Alice installs DEBK, creates ACME’s **business** identity, and adds **Charlene** as a **User** (bookkeeping only). Alice remains an **Administrator** for identity, configuration, and posting as needed.
  - **Acceptance criteria:**
    - Installation completes per product packaging; core operation remains **local** with no mandatory cloud dependency.
    - Alice persists a `business` row (`legal_name`, `functional_currency`) as the isolation root for all ledger data.
    - Alice can create **operator** accounts bound to that business and assign **Administrator** (identity, COA, business profile, bookkeeping) or **User** (bookkeeping and reports only).
    - The system **denies** operations outside the signed-in user’s effective permissions (e.g. Charlene cannot add users or alter COA structure).

- **Chart of accounts and opening structure:**
  - **Primary actor:** Alice.
  - **Story:** Alice establishes ACME’s initial **COA** and opening `acct` rows so Charlene can post against a coherent structure.
  - **Acceptance criteria:**
    - Alice defines starting `acct` records (e.g. bank current account (EFG), share capital, **plant & machinery (3D printers)**, **leasehold improvements – factory**, **office equipment**, payroll control accounts) aligned with `examples.md` / `domain.md`.
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
  - **Primary actor:** Charlene (Alice may review totals before confirm, per ACME policy).
  - **Story:** At year-end, Charlene runs the closing process so temporary accounts (revenue, expense, and any dividends or drawings) reset to zero.
  - **Acceptance criteria:**
    - The system calculates the net activity of all **temporary** `acct` rows (`is_temporary = true`), including **dividends or drawings** where used.
    - Closing `jnlentry` rows use `entry_kind = closing` (or equivalent) and transfer **profit for the period** and dividends (or drawings) effects to **retained earnings** (equity), consistent with `domain.md`.
    - All revenue, expense, and dividends/drawings accounts begin the next `period` with a zero balance; permanent accounts carry forward.
