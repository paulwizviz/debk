# Requirements specification

DEBK is a bookkeeping and financial reporting application for **small businesses** across sectors, for example:

- One-person freelancers (e.g. creative or professional services)
- Small firms selling goods or services
- Small and medium-sized manufacturers

## Purpose and boundaries

DEBK shall be **usable as a bookkeeping system**: it shall support recording transactions in double entry, maintaining a chart of accounts, and **preparing financial statements** (and related working reports) **from the data users enter**.

- **Accuracy:** Figures and statements are **only as reliable as the source data and classifications users supply**. The system shall enforce internal consistency (e.g. debits equal credits); it does **not** warrant completeness, commercial substance, or compliance with tax or company law.
- **No professional advice:** DEBK does **not** provide accounting, tax, or legal advice, and is **not** a tax management or compliance product. Features may allow **posting** of user-directed splits (e.g. payroll with PAYE and NICs lines) as **bookkeeping structure only**; users remain responsible for amounts, rates, and treatment.
- **Sign-off:** Any **financial statement or equivalent output** the application produces is **management or working information only** until **an accountant** (or other person with appropriate professional authority) has **reviewed and separately signed it off** for the intended purpose (e.g. filing, lending, or shareholder reporting). The software does not perform that sign-off and does not replace it.

**In scope:** **recording transactions**; **automated checks on posting integrity** (double-entry and trial-balance consistency—not HMRC or bank-statement reconciliation unless explicitly added later); **presenting financial statements** from the ledger. **Out of scope:** **accounting advice**; **tax reconciliation** as a guided compliance service; **advanced practice workflows** beyond straightforward bookkeeping and reporting.

## Identity management

The application shall support **one or many user accounts** with **access control**. Where more than one user is defined, each shall have **access rights** appropriate to their role.

**Deployment assumption:** Several users (e.g. an owner-administrator, a configuration administrator, and a bookkeeper) shall use the **same running DEBK instance** on the **same platform**—**one** application process and **one** persisted ledger for that business. The product shall **not** be required to operate as a **distributed** system (e.g. no multi-node cluster or replicated application tier for core behaviour). How users reach that instance (e.g. one workstation or multiple sessions) is an implementation detail; the requirement is a **shared** application and **shared** books, with identity and permissions distinguishing operators.

## Configurable application

Users shall be able to **customise** the application for their business. For example, they shall be able to define a **chart of accounts (COA)** aligned to their model—covering the assets, liabilities, equity, turnover, and expense accounts needed to record operations.

## Bookkeeping and accounting features

- **Share capital and funding:** Recording inception through initial share subscriptions (or other equity) and long-term borrowings.
- **Asset lifecycle management:** Recording acquisition of resources and non-cash adjustments (e.g. monthly depreciation) so **carrying amounts** on the **balance sheet** reflect **amounts and policies users record** (the system does not optimise or audit them).
- **Operational complexity (payroll):** Supporting multi-line transactions where one event is split—e.g. gross pay with net payments and liabilities for PAYE and NICs (or other statutory deductions)—**as lines users choose to post**, without advice on correct PAYE or NICs treatment.
- **Turnover (when to recognise it):** Recording income from services performed (e.g. for a named client) for performance measurement.
- **Internal treasury movements:** Recording movements of value within the business (e.g. bank to petty cash) without mischaracterising them as profit or loss.

## Integrity and automated validation

The application shall be **balanced by design**. At the point of entry it shall enforce double entry: **no transaction shall be recorded** where total debits do not equal total credits. That preserves the accounting equation (`Assets = Liabilities + Equity`) **for posted amounts**. This validation does **not** replace independent checks that postings are complete or correct in law or in fact.

## On-demand financial visibility

Users shall be able to **produce structured reports on demand** from the cumulative journal, including:

- **Transaction history (general journal):** A chronological audit trail of recorded events.
- **Performance measurement (profit and loss account):** **Profit for the period** from turnover and operating expenses over a chosen period.
- **Financial position (balance sheet):** Assets, liabilities, and residual equity at a point in time.

These outputs remain subject to the **accountant sign-off** rule under **Purpose and boundaries** above.

## Standalone local execution

- The system shall run **locally only**. It shall **not** require cloud infrastructure or remote connectivity for core operation.
- **Financial data**—including the **COA** and transaction logs—shall be **stored in the user's local environment** so users retain control and privacy.
- The product shall **not** connect directly to third-party systems (e.g. banks or customers' applications); users capture information from those sources and **enter it manually** into DEBK.
