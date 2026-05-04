# Modelling: Double-Entry Bookkeeping (DEBK)

This document defines the architectural and logical models for the DEBK system, ensuring alignment with the principles of double-entry bookkeeping and the requirements of ACME Private Limited.

## 1. DDD Components

### Domain Terms and Classification

| Term | Definition | Classification |
| :--- | :--- | :--- |
| **business** | The legal entity whose books are kept (e.g. ACME Private Limited). Root of isolation: every `acct`, `period`, and `jnlentry` belongs to exactly one `business`. | Entity |
| **acct** | Account: A named record in the general ledger used to track the balance of a specific asset, liability, equity, revenue, or expense. | Entity |
| **coa** | Chart of Accounts: The listing of all `acct` defined for the enterprise, categorised by `acctype`. | Value Object |
| **fintxn** | Financial Transaction: A logical business event representing a movement of value (e.g., "Sale of manufactured parts to Riverside Retail Ltd"). | Domain Event |
| **jnlentry** | Journal Entry: The technical recording of a `fintxn`, comprising multiple `jnline` records that must sum to zero. | Entity |
| **jnline** | Journal Line: A single row within a `jnlentry` that associates an `acct` with a debit or credit amount. | Value Object |
| **acctype** | Account Type: One of the five primary categories (Asset, Liability, Equity, Revenue, Expense) that determine debit/credit rules. | Value Object |
| **genledger** | General Ledger: The "source of truth" containing the full history of all posted `jnlentry` records. | Entity |
| **period** | Accounting period: A specific timeframe (e.g. financial year 202X) used for performance measurement and closing. | Value Object |
| **closing** | Closing entry: A special `jnlentry` that zeroes out temporary accounts (revenue, expense, and dividends or drawings) into equity (typically retained earnings), per the accounting cycle. | Domain Event |
| **trialbal** | Trial Balance: A report listing all `acct` balances to verify that total debits equal total credits. | Value Object |
| **finstmt** | Financial statement: Structured reports (balance sheet, profit and loss account) derived from the `genledger`. | Value Object |

### Disambiguation

- **Transaction (`fintxn`) vs. Database Transaction:** A `fintxn` is a business-level concept representing a financial event. A database transaction is a technical mechanism to ensure ACID properties when persisting a `jnlentry`.
- **Account (`acct`) vs. User Account:** `acct` refers exclusively to a ledger account (e.g., "Petty Cash"). **Operator identity** (who may open the app) is separate from ledger accounts: it gates access to a `business`. For a single-user deployment, one local database may imply one `business` and one implied operator; multi-user access would associate operators with `business` outside the snippet below.
- **Credit (`side`) vs. Credit Limit:** In this system, "Credit" refers strictly to the right-hand side of a journal entry, not a borrowing limit.

### Mapping rules

- **`fintxn` and `jnlentry`:** In DEBK, one posted business event is captured as **one** `jnlentry` (1:1). The `fintxn` is the domain-language event; the `jnlentry` is its ledger representation. Multi-line economic events (e.g. payroll) are still a single `jnlentry` with multiple `jnline` rows. Optional: store a human-readable `fintxn` label or external reference on `jnlentry` for audit narratives.
- **Contra asset vs. `acctype`:** The domain chart lists types such as "contra asset." In the data model, **contra asset is not a sixth `acctype`**: it is an **Asset** account with `is_contra = true` (credit normal balance, offsets its paired asset on the balance sheet).
- **Temporary accounts:** **Temporary (nominal) accounts** include **revenue, expense, and dividends or drawings**. Mark `is_temporary = true` for those; **equity** accounts such as retained earnings and share capital are **permanent** (`is_temporary = false`).
- **Retained earnings:** Closing and the balance sheet assume a **retained earnings** equity `acct`. Initialisation or first-time closing MUST ensure this account exists (create by convention if missing) so **profit for the period** can be transferred without ad hoc accounts.
- **Posting model:** There is **no separate draft journal vs. general ledger** in persistence: a saved `jnlentry` is **posted immediately** to the `genledger` view (running balances by `acct`). **Record journal entries then post** is a logical sequence, not a second storage tier.
- **Currency:** Amounts are in a **single functional currency** per `business` (e.g. GBP in the ACME examples). No multi-currency conversion in scope unless added later.
- **Corrections:** Posted `jnlentry` rows are **immutable**. Errors are corrected by **additional** `jnlentry` rows (e.g. reversing entry), preserving a chronological audit trail.
